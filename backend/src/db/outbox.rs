use serde_json::json;
use sqlx::SqliteConnection;
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

pub const KIND_RCON: &str = "rcon";
pub const KIND_DISCORD_WEBHOOK: &str = "discord_webhook";

/// Ensures usernames interpolated into RCON commands strictly match `[A-Za-z0-9_]` (1..=16 chars).
pub fn is_valid_rcon_username(username: &str) -> bool {
    !username.is_empty()
        && username.len() <= 16
        && username
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'_')
}

pub async fn enqueue_in_tx(
    conn: &mut SqliteConnection,
    kind: &str,
    payload: &str,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>("INSERT INTO outbox (kind, payload) VALUES (?1, ?2) RETURNING id")
        .bind(kind)
        .bind(payload)
        .fetch_one(conn)
        .await
}

pub fn format_vnd_dots(amount: i64) -> String {
    let negative = amount < 0;
    let digits = amount.unsigned_abs().to_string();
    let mut out = String::with_capacity(digits.len() + digits.len() / 3 + 1);
    for (idx, ch) in digits.chars().rev().enumerate() {
        if idx > 0 && idx % 3 == 0 {
            out.push('.');
        }
        out.push(ch);
    }
    let formatted: String = out.chars().rev().collect();
    if negative {
        format!("-{formatted}")
    } else {
        formatted
    }
}

pub fn build_donation_webhook_payload(
    username: &str,
    amount: i64,
    method: &str,
    message: Option<&str>,
) -> String {
    let timestamp = OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string());
    let amount_str = format!("{} VND đ", format_vnd_dots(amount));
    let note = message
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("Không có");

    json!({
        "embeds": [
            {
                "title": "💖 Có người quyên góp mới!",
                "description": format!("Cảm ơn **{username}** đã ủng hộ máy chủ!"),
                "color": 3_066_993,
                "fields": [
                    { "name": "Người nạp", "value": username, "inline": true },
                    { "name": "Số tiền", "value": amount_str, "inline": true },
                    { "name": "Hình thức", "value": method, "inline": true },
                    { "name": "Nội dung", "value": note, "inline": false }
                ],
                "timestamp": timestamp
            }
        ]
    })
    .to_string()
}
