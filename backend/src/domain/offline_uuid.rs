use md5::{Digest, Md5};

/// Computes Minecraft's deterministic Offline Player UUID (version 3, IETF variant)
/// from `MD5("OfflinePlayer:" + username)` in lowercase `8-4-4-4-12` format.
pub fn offline_uuid(username: &str) -> String {
    let mut hasher = Md5::new();
    hasher.update(b"OfflinePlayer:");
    hasher.update(username.as_bytes());
    let mut bytes: [u8; 16] = hasher.finalize().into();

    bytes[6] = (bytes[6] & 0x0f) | 0x30;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    format!(
        "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3],
        bytes[4],
        bytes[5],
        bytes[6],
        bytes[7],
        bytes[8],
        bytes[9],
        bytes[10],
        bytes[11],
        bytes[12],
        bytes[13],
        bytes[14],
        bytes[15],
    )
}

/// Computes `offline_uuid` returning `None` when the trimmed username is blank.
pub fn try_offline_uuid(username: &str) -> Option<String> {
    if username.trim().is_empty() {
        None
    } else {
        Some(offline_uuid(username))
    }
}
