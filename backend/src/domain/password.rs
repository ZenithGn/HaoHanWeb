use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use password_hash::SaltString;
use rand::RngCore;
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VerifyResult {
    pub valid: bool,
    pub needs_rehash: bool,
}

/// Hashes a password with Argon2id on a blocking worker thread.
pub async fn hash_password(password: String) -> anyhow::Result<String> {
    tokio::task::spawn_blocking(move || hash_password_sync(&password))
        .await
        .map_err(|e| anyhow::anyhow!("Password hashing task failed: {e}"))?
}

/// Synchronously hashes a password with Argon2id and a 16-byte CSPRNG salt.
pub fn hash_password_sync(password: &str) -> anyhow::Result<String> {
    let mut salt_bytes = [0u8; 16];
    rand::rngs::OsRng.fill_bytes(&mut salt_bytes);
    let salt = SaltString::encode_b64(&salt_bytes)
        .map_err(|e| anyhow::anyhow!("Failed to encode Argon2 salt: {e}"))?;
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("Argon2id hashing failed: {e}"))?
        .to_string();
    Ok(hash)
}

/// Verifies a password against an Argon2id PHC string or legacy AuthMe `$SHA$<salt>$<hex>` hash
/// on a blocking worker thread. Sets `needs_rehash = true` when a legacy hash matches.
pub async fn verify_password(
    password: String,
    stored_hash: String,
) -> anyhow::Result<VerifyResult> {
    tokio::task::spawn_blocking(move || verify_password_sync(&password, &stored_hash))
        .await
        .map_err(|e| anyhow::anyhow!("Password verification task failed: {e}"))
}

/// Synchronously verifies a password against Argon2id or legacy AuthMe `$SHA$` hashes.
pub fn verify_password_sync(password: &str, stored_hash: &str) -> VerifyResult {
    if stored_hash.is_empty()
        || stored_hash == "UNREGISTERED_GHOST"
        || stored_hash == "DISCORD_AUTH"
    {
        return VerifyResult {
            valid: false,
            needs_rehash: false,
        };
    }

    if stored_hash.starts_with("$argon2") {
        let Ok(parsed) = PasswordHash::new(stored_hash) else {
            return VerifyResult {
                valid: false,
                needs_rehash: false,
            };
        };
        let valid = Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok();
        let needs_rehash = valid && !stored_hash.starts_with("$argon2id$");
        return VerifyResult {
            valid,
            needs_rehash,
        };
    }

    if stored_hash.starts_with("$SHA$") {
        let valid = verify_authme_sha256(password, stored_hash);
        return VerifyResult {
            valid,
            needs_rehash: valid,
        };
    }

    VerifyResult {
        valid: false,
        needs_rehash: false,
    }
}

fn verify_authme_sha256(password: &str, stored_hash: &str) -> bool {
    let mut parts = stored_hash.split('$');
    let (Some(""), Some("SHA"), Some(salt), Some(expected_hex), None) = (
        parts.next(),
        parts.next(),
        parts.next(),
        parts.next(),
        parts.next(),
    ) else {
        return false;
    };

    if salt.is_empty() || expected_hex.is_empty() {
        return false;
    }

    let first_hash = hex::encode(Sha256::digest(password.as_bytes()));
    let mut second_input = String::with_capacity(first_hash.len() + salt.len());
    second_input.push_str(&first_hash);
    second_input.push_str(salt);
    let calculated_hex = hex::encode(Sha256::digest(second_input.as_bytes()));
    let expected_lower = expected_hex.to_ascii_lowercase();

    calculated_hex
        .as_bytes()
        .ct_eq(expected_lower.as_bytes())
        .into()
}
