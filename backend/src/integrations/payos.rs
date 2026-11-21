use std::time::Duration;

use serde_json::{Value, json};

use crate::domain::payos_crypto::{clean_payos_description, sign_payment_request};
use crate::state::AppState;

pub const DEFAULT_PAYOS_BASE_URL: &str = "https://api-merchant.payos.vn/v2/payment-requests";

/// Optional axum `Extension` used by integration tests to direct PayOS calls to a local mock server.
#[derive(Debug, Clone)]
pub struct PayOsBaseUrl(pub String);

#[derive(Debug, Clone)]
pub struct PayOsClient {
    http: reqwest::Client,
    base_url: String,
    client_id: String,
    api_key: String,
    checksum_key: String,
}

impl PayOsClient {
    pub fn from_state(state: &AppState, base_url_override: Option<&str>) -> Self {
        let base_url = base_url_override
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(DEFAULT_PAYOS_BASE_URL);

        Self::with_base_url(
            state.http.clone(),
            base_url,
            state.cfg.payos_client_id.clone().unwrap_or_default(),
            state.cfg.payos_api_key.clone().unwrap_or_default(),
            state.cfg.payos_checksum_key.clone().unwrap_or_default(),
        )
    }

    pub fn with_base_url(
        http: reqwest::Client,
        base_url: impl Into<String>,
        client_id: impl Into<String>,
        api_key: impl Into<String>,
        checksum_key: impl Into<String>,
    ) -> Self {
        Self {
            http,
            base_url: base_url.into().trim_end_matches('/').to_string(),
            client_id: client_id.into(),
            api_key: api_key.into(),
            checksum_key: checksum_key.into(),
        }
    }

    pub async fn create_payment_link(
        &self,
        order_code: i64,
        amount: i64,
        description: &str,
        return_url: &str,
        cancel_url: &str,
        buyer_name: &str,
    ) -> Value {
        let clean_desc = clean_payos_description(description);
        let signature = sign_payment_request(
            &self.checksum_key,
            amount,
            cancel_url,
            &clean_desc,
            order_code,
            return_url,
        );

        let payload = json!({
            "orderCode": order_code,
            "amount": amount,
            "description": clean_desc,
            "cancelUrl": cancel_url,
            "returnUrl": return_url,
            "buyerName": buyer_name,
            "signature": signature
        });

        let resp = self
            .http
            .post(&self.base_url)
            .header("x-client-id", &self.client_id)
            .header("x-api-key", &self.api_key)
            .json(&payload)
            .timeout(Duration::from_secs(10))
            .send()
            .await;

        match resp {
            Ok(response) => match response.json::<Value>().await {
                Ok(parsed) => parsed,
                Err(err) => {
                    tracing::error!(error = %err, "Failed to parse PayOS create payment link response");
                    json!({ "code": "error", "desc": err.to_string() })
                }
            },
            Err(err) => {
                tracing::error!(error = %err, "PayOS create payment link request failed");
                json!({ "code": "error", "desc": err.to_string() })
            }
        }
    }

    pub async fn get_payment_request(&self, order_code: &str) -> Value {
        let url = format!("{}/{}", self.base_url, order_code);
        let resp = self
            .http
            .get(&url)
            .header("x-client-id", &self.client_id)
            .header("x-api-key", &self.api_key)
            .header("Content-Type", "application/json")
            .timeout(Duration::from_secs(10))
            .send()
            .await;

        match resp {
            Ok(response) => match response.json::<Value>().await {
                Ok(parsed) => parsed,
                Err(err) => {
                    tracing::error!(error = %err, order_code = %order_code, "Failed to parse PayOS get payment response");
                    json!({ "code": "error", "desc": err.to_string() })
                }
            },
            Err(err) => {
                tracing::error!(error = %err, order_code = %order_code, "PayOS get payment request failed");
                json!({ "code": "error", "desc": err.to_string() })
            }
        }
    }
}
