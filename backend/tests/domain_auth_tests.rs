use std::collections::HashSet;
use std::time::{SystemTime, UNIX_EPOCH};

use jsonwebtoken::Algorithm;
use sha2::{Digest, Sha256};

use haohan_backend::domain::jwt::{
    DISCORD_STATE_TTL_SECS, DiscordStateClaims, PURPOSE_DISCORD_LINK, PURPOSE_DISCORD_LOGIN,
    SESSION_TTL_SECS, decode_discord_state, decode_session_token, encode_discord_link_state,
    encode_discord_login_state, encode_discord_state_with_exp, encode_session_token,
    encode_session_token_with_exp,
};
use haohan_backend::domain::link_code::{LINK_CODE_CHARSET, LINK_CODE_LEN, generate_link_code};
use haohan_backend::domain::offline_uuid::{offline_uuid, try_offline_uuid};
use haohan_backend::domain::password::{VerifyResult, hash_password, verify_password};
use haohan_backend::domain::roles::{DISCORD_ROLE_HIERARCHY, determine_highest_role};

fn make_authme_sha256(password: &str, salt: &str) -> String {
    let first = hex::encode(Sha256::digest(password.as_bytes()));
    let second = hex::encode(Sha256::digest(format!("{first}{salt}").as_bytes()));
    format!("$SHA${salt}${second}")
}

fn now_secs() -> usize {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize
}

#[tokio::test]
async fn password_argon2id_roundtrip_and_unique_salts() {
    let h1 = hash_password("secret123".to_string()).await.unwrap();
    let h2 = hash_password("secret123".to_string()).await.unwrap();

    assert!(h1.starts_with("$argon2id$"));
    assert!(h2.starts_with("$argon2id$"));
    assert_ne!(h1, h2);

    assert_eq!(
        verify_password("secret123".to_string(), h1.clone())
            .await
            .unwrap(),
        VerifyResult {
            valid: true,
            needs_rehash: false,
        }
    );
    assert_eq!(
        verify_password("wrongpass".to_string(), h1).await.unwrap(),
        VerifyResult {
            valid: false,
            needs_rehash: false,
        }
    );
}

#[tokio::test]
async fn password_legacy_authme_sha256_and_sentinels() {
    let legacy = make_authme_sha256("MyLegacyPass!9", "a1b2c3d4e5f60708");
    assert_eq!(
        verify_password("MyLegacyPass!9".to_string(), legacy.clone())
            .await
            .unwrap(),
        VerifyResult {
            valid: true,
            needs_rehash: true,
        }
    );
    assert_eq!(
        verify_password("wrong".to_string(), legacy).await.unwrap(),
        VerifyResult {
            valid: false,
            needs_rehash: false,
        }
    );

    // Uppercase legacy hex should also verify and request rehash
    let legacy_upper = make_authme_sha256("pass", "0011223344556677");
    let parts: Vec<&str> = legacy_upper.split('$').collect();
    let upper = format!("$SHA${}${}", parts[2], parts[3].to_ascii_uppercase());
    assert_eq!(
        verify_password("pass".to_string(), upper).await.unwrap(),
        VerifyResult {
            valid: true,
            needs_rehash: true,
        }
    );

    for invalid in [
        "",
        "UNREGISTERED_GHOST",
        "DISCORD_AUTH",
        "$SHA$",
        "$SHA$onlysalt$",
        "$SHA$$onlyhash",
        "$SHA$salt$hash$extra",
        "$SHA1$salt$hash",
        "$argon2id$corrupted",
    ] {
        assert_eq!(
            verify_password("anything".to_string(), invalid.to_string())
                .await
                .unwrap(),
            VerifyResult {
                valid: false,
                needs_rehash: false,
            },
            "expected failure for stored hash: {invalid}"
        );
    }
}

#[test]
fn offline_uuid_matches_notch_vector_and_v3_layout() {
    assert_eq!(
        offline_uuid("Notch"),
        "b50ad385-829d-3141-a216-7e7d7539ba7f"
    );

    let lower_notch = offline_uuid("notch");
    assert_ne!(lower_notch, "b50ad385-829d-3141-a216-7e7d7539ba7f");

    let steve = offline_uuid("Steve");
    assert_eq!(steve.len(), 36);
    assert_eq!(steve.chars().nth(14), Some('3'));
    assert!(matches!(steve.chars().nth(19), Some('8' | '9' | 'a' | 'b')));
    assert_eq!(steve, offline_uuid("Steve"));
    assert_eq!(try_offline_uuid("   "), None);
    assert_eq!(
        try_offline_uuid("Notch").as_deref(),
        Some("b50ad385-829d-3141-a216-7e7d7539ba7f")
    );
}

#[test]
fn jwt_session_and_discord_state_tokens() {
    let secret = "test_secret_123";
    let now = now_secs();

    let session_tok = encode_session_token(secret, 42).unwrap();
    let claims = decode_session_token(secret, &session_tok).expect("valid session token");
    assert_eq!(claims.user_id, 42);
    assert!(claims.purpose.is_none());
    assert!(claims.exp >= now + SESSION_TTL_SECS - 5);
    assert!(claims.exp <= now + SESSION_TTL_SECS + 5);

    assert!(decode_session_token("wrong_secret", &session_tok).is_none());

    let expired_session =
        encode_session_token_with_exp(secret, 42, now.saturating_sub(120)).unwrap();
    assert!(decode_session_token(secret, &expired_session).is_none());

    let link_state = encode_discord_link_state(secret, 77).unwrap();
    assert!(decode_session_token(secret, &link_state).is_none());
    let link_claims =
        decode_discord_state(secret, &link_state, PURPOSE_DISCORD_LINK).expect("valid link state");
    assert_eq!(link_claims.user_id, Some(77));
    assert_eq!(link_claims.purpose, PURPOSE_DISCORD_LINK);
    assert!(link_claims.exp >= now + DISCORD_STATE_TTL_SECS - 5);
    assert!(decode_discord_state(secret, &link_state, PURPOSE_DISCORD_LOGIN).is_none());

    let login_state = encode_discord_login_state(secret).unwrap();
    assert!(decode_session_token(secret, &login_state).is_none());
    let login_claims = decode_discord_state(secret, &login_state, PURPOSE_DISCORD_LOGIN)
        .expect("valid login state");
    assert_eq!(login_claims.user_id, None);
    assert_eq!(login_claims.purpose, PURPOSE_DISCORD_LOGIN);

    // Frontend DiscordCallbackClient.js reads payload JSON with atob() and expects no user_id
    let decoded = jsonwebtoken::decode::<DiscordStateClaims>(
        &login_state,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &jsonwebtoken::Validation::new(Algorithm::HS256),
    )
    .unwrap();
    let payload_json = serde_json::to_string(&decoded.claims).unwrap();
    assert!(!payload_json.contains("user_id"));

    let expired_state = encode_discord_state_with_exp(
        secret,
        Some(1),
        PURPOSE_DISCORD_LINK,
        now.saturating_sub(120),
    )
    .unwrap();
    assert!(decode_discord_state(secret, &expired_state, PURPOSE_DISCORD_LINK).is_none());
}

#[test]
fn roles_hierarchy_and_case_insensitive_unicode() {
    assert_eq!(DISCORD_ROLE_HIERARCHY.len(), 13);
    assert_eq!(determine_highest_role::<&str>(&[]), "default");
    assert_eq!(determine_highest_role(&["Guest", "VIP"]), "default");

    // Priority order check: higher rank wins over lower rank
    assert_eq!(
        determine_highest_role(&["Members", "Donator", "Helper"]),
        "Helper"
    );
    assert_eq!(
        determine_highest_role(&["Members", "Owner", "Administrator"]),
        "Owner"
    );

    // Case-insensitive ASCII & Vietnamese Unicode
    assert_eq!(determine_highest_role(&["donator"]), "Donator");
    assert_eq!(determine_highest_role(&["MEMBERS"]), "Members");
    assert_eq!(determine_highest_role(&["cán bộ"]), "Cán Bộ");
    assert_eq!(determine_highest_role(&["CÁN BỘ"]), "Cán Bộ");
    assert_eq!(determine_highest_role(&["hảo hán bot"]), "Hảo Hán Bot");
}

#[test]
fn link_code_length_charset_and_entropy() {
    let allowed: HashSet<char> = LINK_CODE_CHARSET.iter().map(|&b| b as char).collect();
    let mut seen = HashSet::new();

    for _ in 0..500 {
        let code = generate_link_code();
        assert_eq!(code.len(), LINK_CODE_LEN);
        for ch in code.chars() {
            assert!(allowed.contains(&ch), "unexpected char {ch} in {code}");
            assert!(!matches!(ch, 'O' | '0' | 'I' | '1'));
        }
        seen.insert(code);
    }

    assert!(seen.len() > 450);
}
