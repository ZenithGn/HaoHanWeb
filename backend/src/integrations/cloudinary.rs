use std::time::{SystemTime, UNIX_EPOCH};

use serde::Deserialize;
use sha1::{Digest, Sha1};

use crate::config::Config;

pub const DEFAULT_CLOUDINARY_BASE: &str = "https://api.cloudinary.com/v1_1";
pub const CLOUDINARY_AVATAR_FOLDER: &str = "haohan_avatars";

#[derive(Debug, Clone)]
pub struct CloudinaryClient {
    upload_base: String,
}

#[derive(Debug, Deserialize)]
struct CloudinaryUploadResponse {
    secure_url: Option<String>,
    url: Option<String>,
}

impl Default for CloudinaryClient {
    fn default() -> Self {
        Self::new()
    }
}

impl CloudinaryClient {
    /// Creates a Cloudinary client targeting the production Cloudinary API base URL.
    pub fn new() -> Self {
        Self {
            upload_base: DEFAULT_CLOUDINARY_BASE.to_string(),
        }
    }

    /// Creates a Cloudinary client with an overridden base URL for local mock HTTP tests.
    pub fn with_url(upload_base: impl Into<String>) -> Self {
        Self {
            upload_base: upload_base.into().trim_end_matches('/').to_string(),
        }
    }

    /// Computes Cloudinary's SHA-1 signature over alphabetically sorted `folder` & `timestamp`
    /// concatenated with `api_secret`.
    pub fn sign_upload_params(folder: &str, timestamp: &str, api_secret: &str) -> String {
        let payload = format!("folder={folder}&timestamp={timestamp}{api_secret}");
        hex::encode(Sha1::digest(payload.as_bytes()))
    }

    /// Uploads `image_url` to Cloudinary when configured; falls back to `image_url` on missing
    /// credentials or any HTTP/network/parsing failure.
    pub async fn upload_image(
        &self,
        http: &reqwest::Client,
        cfg: &Config,
        image_url: &str,
    ) -> String {
        let (Some(cloud_name), Some(api_key), Some(api_secret)) = (
            cfg.cloudinary_cloud_name
                .as_deref()
                .filter(|s| !s.is_empty()),
            cfg.cloudinary_api_key.as_deref().filter(|s| !s.is_empty()),
            cfg.cloudinary_api_secret
                .as_deref()
                .filter(|s| !s.is_empty()),
        ) else {
            tracing::warn!("Cloudinary configuration missing. Using original Discord avatar URL.");
            return image_url.to_string();
        };

        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs().to_string())
            .unwrap_or_else(|_| "0".to_string());
        let signature = Self::sign_upload_params(CLOUDINARY_AVATAR_FOLDER, &timestamp, api_secret);
        let endpoint = format!("{}/{cloud_name}/image/upload", self.upload_base);

        let resp = match http
            .post(&endpoint)
            .form(&[
                ("file", image_url),
                ("api_key", api_key),
                ("timestamp", timestamp.as_str()),
                ("folder", CLOUDINARY_AVATAR_FOLDER),
                ("signature", signature.as_str()),
            ])
            .send()
            .await
        {
            Ok(resp) => resp,
            Err(err) => {
                tracing::error!(error = %err, "Cloudinary request error; falling back to original URL");
                return image_url.to_string();
            }
        };

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            tracing::error!(%status, body = %body, "Cloudinary upload failed; falling back to original URL");
            return image_url.to_string();
        }

        match resp.json::<CloudinaryUploadResponse>().await {
            Ok(parsed) => parsed
                .secure_url
                .or(parsed.url)
                .filter(|u| !u.is_empty())
                .unwrap_or_else(|| image_url.to_string()),
            Err(err) => {
                tracing::error!(error = %err, "Failed to parse Cloudinary upload response");
                image_url.to_string()
            }
        }
    }
}
