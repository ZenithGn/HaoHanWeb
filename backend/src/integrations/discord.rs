use serde_json::{Value, json};
use time::OffsetDateTime;
use time::format_description::well_known::Rfc3339;

/// Builds the Discord webhook embed payload for `notify_new_user`, matching `DiscordService.notify_new_user`.
pub fn build_new_user_webhook_payload(username: &str, uuid: Option<&str>) -> Value {
    let timestamp = OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .unwrap_or_default();
    let uuid_display = uuid.filter(|u| !u.is_empty()).unwrap_or("Chưa liên kết");

    json!({
        "embeds": [
            {
                "title": "🎉 Thành viên mới đăng ký!",
                "description": format!(
                    "Chào mừng **{username}** đã đăng ký tài khoản thành công trên hệ thống Web Portal."
                ),
                "color": 3_447_003,
                "fields": [
                    { "name": "Tên nhân vật", "value": username, "inline": true },
                    { "name": "UUID", "value": uuid_display, "inline": true }
                ],
                "timestamp": timestamp
            }
        ]
    })
}
