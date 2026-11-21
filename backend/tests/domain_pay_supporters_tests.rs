use std::collections::HashMap;

use serde_json::{Map, Value, json};

use haohan_backend::domain::payos_crypto::{
    canonicalize_payos_data, clean_payos_description, payos_transfer_description,
    remove_vietnamese_accents, sign_payment_request, sign_payos_data_map,
    verify_webhook_data_signature, verify_webhook_signature,
};
use haohan_backend::domain::supporters_parser::{
    DiscordMessageInput, MentionProfile, SupporterEntry, build_supporters_payload, extract_amounts,
    extract_pages, manual_messages_input, merge_supporters, normalize_discord_line,
    parse_supporter_line, split_names,
};

#[test]
fn payos_accent_removal_and_transfer_description_rules() {
    assert_eq!(
        remove_vietnamese_accents("Ủng hộ Hảo Hán SMP - Đào Đình Đô!"),
        "Ung ho Hao Han SMP - Dao Dinh Do!"
    );

    assert_eq!(
        clean_payos_description("Nạp VIP cho Đạt_123!!! siêu dài hơn 25 ký tự"),
        "Nap VIP cho Dat123 si"
    );

    let desc = payos_transfer_description(1_730_000_123_456, "Steve_VN_123456");
    assert_eq!(desc, "GD123456 UH HHSMP SteveVN");
    assert!(desc.len() <= 25);
    assert!(desc.chars().all(|c| c.is_ascii_alphanumeric() || c == ' '));

    let short_desc = payos_transfer_description(42, "Ánh_Đào");
    assert_eq!(short_desc, "GD42 UH HHSMP AnhDao");
    assert!(short_desc.len() <= 25);
}

#[test]
fn payos_sign_request_and_verify_webhook_constant_time() {
    let checksum = "my_secret_checksum_key";
    let sig = sign_payment_request(
        checksum,
        50_000,
        "https://api.example.com/donate?lang=vi&orderCode=123456&cancel=true",
        "GD123456 UH HHSMP Steve",
        123_456,
        "https://api.example.com/donate?lang=vi&orderCode=123456",
    );
    assert_eq!(sig.len(), 64);

    let mut data = Map::new();
    data.insert("orderCode".into(), json!(123_456));
    data.insert("amount".into(), json!(50_000));
    data.insert("description".into(), json!("Nap game"));
    data.insert("nullField".into(), Value::Null);
    data.insert("active".into(), json!(true));
    data.insert("nested".into(), json!({ "z": 1, "a": "hello" }));

    let canonical = canonicalize_payos_data(&data);
    assert_eq!(
        canonical,
        r#"active=true&amount=50000&description=Nap game&nested={"a":"hello","z":1}&nullField=&orderCode=123456"#
    );

    let expected_sig = sign_payos_data_map(checksum, &data);
    assert!(verify_webhook_data_signature(
        checksum,
        &data,
        &expected_sig
    ));
    assert!(verify_webhook_data_signature(
        checksum,
        &data,
        &expected_sig.to_ascii_uppercase()
    ));

    let body = json!({
        "code": "00",
        "success": true,
        "data": data,
        "signature": expected_sig
    });
    assert!(verify_webhook_signature(checksum, &body));

    // Tampered amount or wrong signature must fail
    let mut tampered = body.clone();
    tampered["data"]["amount"] = json!(99_000);
    assert!(!verify_webhook_signature(checksum, &tampered));
    assert!(!verify_webhook_signature(
        checksum,
        &json!({ "data": {}, "signature": "" })
    ));
    assert!(!verify_webhook_signature("wrong_key", &body));
}

#[test]
fn supporters_line_normalization_and_amount_extraction() {
    assert_eq!(normalize_discord_line("  ```text\n"), "");
    assert_eq!(
        normalize_discord_line("  > 12. @Steve | Steve - 50,000 VND ```  "),
        "@Steve | Steve - 50,000 VND"
    );

    let k_amounts = extract_amounts("@WAT - WAT | 100k");
    assert_eq!(k_amounts.len(), 1);
    assert_eq!(k_amounts[0].value, 100_000);

    let vnd_unicode = extract_amounts("@A - 50.000đ + 20,000 VNĐ + 10000 VND");
    let total: i64 = vnd_unicode.iter().map(|a| a.value).sum();
    assert_eq!(total, 80_000);

    let mixed_paren =
        extract_amounts("@dan choi nam dinh™ | 50,000 VND + 2 ảnh gái alimi cho owner (60,000)");
    let mixed_total: i64 = mixed_paren.iter().map(|a| a.value).sum();
    assert_eq!(mixed_total, 110_000);

    // Must not match inside words like "đồng"
    assert!(extract_amounts("@Someone - 50 đồng").is_empty());
}

#[test]
fn supporters_mention_resolution_and_split_names() {
    let mut mentions = HashMap::new();
    mentions.insert(
        "749112696191975434".to_string(),
        MentionProfile {
            discord_id: "749112696191975434".to_string(),
            name: "Pico".to_string(),
            avatar_url: Some(
                "https://cdn.discordapp.com/avatars/749112696191975434/abc.png?size=96".to_string(),
            ),
            banner_url: Some(
                "https://cdn.discordapp.com/banners/749112696191975434/ban.png?size=512"
                    .to_string(),
            ),
            accent_color: Some(16711680),
        },
    );

    let (dn, mc) = split_names("<@!749112696191975434> | PicoXSVipMax", &mentions);
    assert_eq!(dn, "Pico");
    assert_eq!(mc.as_deref(), Some("PicoXSVipMax"));

    let entry = parse_supporter_line("<@749112696191975434> | PicoXSVipMax - 200k", &mentions)
        .expect("should parse mention line");
    assert_eq!(entry.display_name, "Pico");
    assert_eq!(entry.minecraft_name.as_deref(), Some("PicoXSVipMax"));
    assert_eq!(entry.username, "PicoXSVipMax");
    assert_eq!(entry.discord_id.as_deref(), Some("749112696191975434"));
    assert_eq!(entry.amount, 200_000);
    assert_eq!(entry.accent_color, Some(16711680));
    assert!(entry.avatar_url.is_some());
    assert!(entry.banner_url.is_some());
}

#[test]
fn supporters_manual_messages_golden_test() {
    let messages = manual_messages_input();
    let pages = extract_pages(&messages);
    assert_eq!(pages.len(), 2);
    assert_eq!(pages[0].0, 1);
    assert_eq!(pages[0].1.len(), 20);
    assert_eq!(pages[1].0, 2);
    assert_eq!(pages[1].1.len(), 19);

    let payload = build_supporters_payload(&messages, "manual", "2026-11-21T00:00:00Z".to_string());

    assert_eq!(payload.pages.len(), 2);
    assert_eq!(payload.pages[0].number, 1);
    assert_eq!(payload.pages[0].count, 20);
    assert_eq!(payload.pages[1].number, 2);
    assert_eq!(payload.pages[1].count, 19);

    // Miophilk appears on both Trang 1 (40k) and Trang 2 (100k) -> merges to 38 unique supporters
    assert_eq!(payload.supporters.len(), 38);

    let grand_total: i64 = payload.supporters.iter().map(|s| s.amount).sum();
    assert_eq!(grand_total, 6_520_000);

    // Top 3 ordering
    assert_eq!(payload.supporters[0].display_name, "Pico");
    assert_eq!(payload.supporters[0].username, "PicoXSVipMax");
    assert_eq!(payload.supporters[0].amount, 3_550_000);

    assert_eq!(payload.supporters[1].display_name, "unknown-user");
    assert_eq!(payload.supporters[1].username, "JUnLI");
    assert_eq!(payload.supporters[1].amount, 400_000);

    assert_eq!(payload.supporters[2].display_name, "a");
    assert_eq!(payload.supporters[2].username, "Tuckii");
    assert_eq!(payload.supporters[2].amount, 250_000);

    // Merged Miophilk check
    let miophilk = payload
        .supporters
        .iter()
        .find(|s| s.display_name == "Miophilk")
        .expect("Miophilk must exist");
    assert_eq!(miophilk.amount, 140_000);
    assert_eq!(miophilk.entries, 2);
    assert_eq!(miophilk.minecraft_name.as_deref(), Some("Miophilkv3"));

    // Multiple Deleted User#0000 lines with distinct minecraft_name must NOT collapse together
    let deleted_users: Vec<&SupporterEntry> = payload
        .supporters
        .iter()
        .filter(|s| s.display_name == "Deleted User#0000")
        .collect();
    assert_eq!(deleted_users.len(), 4);

    // Special line: dan choi nam dinh™ (50k + 60k)
    let nam_dinh = payload
        .supporters
        .iter()
        .find(|s| s.display_name.contains("dan choi nam dinh"))
        .expect("dan choi nam dinh must exist");
    assert_eq!(nam_dinh.amount, 110_000);

    // Backslash line preserved verbatim
    let backslash = payload
        .supporters
        .iter()
        .find(|s| s.display_name == "\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\")
        .expect("backslash entry must exist");
    assert_eq!(backslash.amount, 50_000);

    // Card-note line
    let sicubidu = payload
        .supporters
        .iter()
        .find(|s| s.display_name == "sicubidu - 0Clone")
        .expect("sicubidu entry must exist");
    assert_eq!(sicubidu.amount, 100_000);
    assert!(sicubidu.minecraft_name.is_none());

    // Merge tie-break check: equal amounts sorted case-insensitively by display_name ASC
    let tie_merged = merge_supporters(vec![
        SupporterEntry {
            display_name: "zeta".into(),
            username: "zeta".into(),
            minecraft_name: None,
            discord_id: None,
            role: "Donator".into(),
            amount: 50_000,
            entries: 1,
            avatar_url: None,
            banner_url: None,
            accent_color: None,
        },
        SupporterEntry {
            display_name: "Alpha".into(),
            username: "Alpha".into(),
            minecraft_name: None,
            discord_id: None,
            role: "Donator".into(),
            amount: 50_000,
            entries: 1,
            avatar_url: None,
            banner_url: None,
            accent_color: None,
        },
    ]);
    assert_eq!(tie_merged[0].display_name, "Alpha");
    assert_eq!(tie_merged[1].display_name, "zeta");

    // Lines before Trang N are ignored
    let pre_header = extract_pages(&[DiscordMessageInput {
        content: "@Ignored - 50k\nTrang 3\n@Kept - 25k".into(),
        mentions: Vec::new(),
    }]);
    assert_eq!(pre_header.len(), 1);
    assert_eq!(pre_header[0].0, 3);
    assert_eq!(pre_header[0].1.len(), 1);
    assert_eq!(pre_header[0].1[0].amount, 25_000);
}
