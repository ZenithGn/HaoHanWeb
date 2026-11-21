use std::collections::BTreeMap;

use hmac::{Hmac, Mac};
use serde_json::{Map, Value};
use sha2::Sha256;
use subtle::ConstantTimeEq;

type HmacSha256 = Hmac<Sha256>;

/// Removes Vietnamese diacritics and maps `đ`/`Đ` to ASCII `d`/`D`.
pub fn remove_vietnamese_accents(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for ch in input.chars() {
        let mapped = match ch {
            'à' | 'á' | 'ả' | 'ã' | 'ạ' | 'ă' | 'ằ' | 'ắ' | 'ẳ' | 'ẵ' | 'ặ' | 'â' | 'ầ' | 'ấ'
            | 'ẩ' | 'ẫ' | 'ậ' => 'a',
            'À' | 'Á' | 'Ả' | 'Ã' | 'Ạ' | 'Ă' | 'Ằ' | 'Ắ' | 'Ẳ' | 'Ẵ' | 'Ặ' | 'Â' | 'Ầ' | 'Ấ'
            | 'Ẩ' | 'Ẫ' | 'Ậ' => 'A',
            'đ' => 'd',
            'Đ' => 'D',
            'è' | 'é' | 'ẻ' | 'ẽ' | 'ẹ' | 'ê' | 'ề' | 'ế' | 'ể' | 'ễ' | 'ệ' => {
                'e'
            }
            'È' | 'É' | 'Ẻ' | 'Ẽ' | 'Ẹ' | 'Ê' | 'Ề' | 'Ế' | 'Ể' | 'Ễ' | 'Ệ' => {
                'E'
            }
            'ì' | 'í' | 'ỉ' | 'ĩ' | 'ị' => 'i',
            'Ì' | 'Í' | 'Ỉ' | 'Ĩ' | 'Ị' => 'I',
            'ò' | 'ó' | 'ỏ' | 'õ' | 'ọ' | 'ô' | 'ồ' | 'ố' | 'ổ' | 'ỗ' | 'ộ' | 'ơ' | 'ờ' | 'ớ'
            | 'ở' | 'ỡ' | 'ợ' => 'o',
            'Ò' | 'Ó' | 'Ỏ' | 'Õ' | 'Ọ' | 'Ô' | 'Ồ' | 'Ố' | 'Ổ' | 'Ỗ' | 'Ộ' | 'Ơ' | 'Ờ' | 'Ớ'
            | 'Ở' | 'Ỡ' | 'Ợ' => 'O',
            'ù' | 'ú' | 'ủ' | 'ũ' | 'ụ' | 'ư' | 'ừ' | 'ứ' | 'ử' | 'ữ' | 'ự' => {
                'u'
            }
            'Ù' | 'Ú' | 'Ủ' | 'Ũ' | 'Ụ' | 'Ư' | 'Ừ' | 'Ứ' | 'Ử' | 'Ữ' | 'Ự' => {
                'U'
            }
            'ỳ' | 'ý' | 'ỷ' | 'ỹ' | 'ỵ' => 'y',
            'Ỳ' | 'Ý' | 'Ỷ' | 'Ỹ' | 'Ỵ' => 'Y',
            // Ignore Unicode combining diacritical marks if decomposed text is passed.
            '\u{0300}'..='\u{036F}' => continue,
            other => other,
        };
        out.push(mapped);
    }
    out
}

/// Sanitizes an arbitrary description to PayOS limits: <= 25 chars, ASCII `[a-zA-Z0-9 ]`, trimmed.
pub fn clean_payos_description(description: &str) -> String {
    let unaccented = remove_vietnamese_accents(description);
    unaccented
        .chars()
        .take(25)
        .filter(|ch| ch.is_ascii_alphanumeric() || *ch == ' ')
        .collect::<String>()
        .trim()
        .to_string()
}

/// Builds the PayOS bank transfer description `GD<last6> UH HHSMP <clean_user>` (<= 25 chars).
pub fn payos_transfer_description(order_code: i64, username: &str) -> String {
    let code_str = order_code.to_string();
    let compact_code = if code_str.len() > 6 {
        &code_str[code_str.len() - 6..]
    } else {
        code_str.as_str()
    };
    let clean_username: String = remove_vietnamese_accents(username)
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .collect();
    let raw = format!("GD{compact_code} UH HHSMP {clean_username}");
    clean_payos_description(&raw)
}

/// Computes lowercase hex HMAC-SHA256 over `data` using `key`.
pub fn hmac_sha256_hex(key: &str, data: &str) -> String {
    let mut mac =
        HmacSha256::new_from_slice(key.as_bytes()).expect("HMAC accepts keys of any length");
    mac.update(data.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

/// Signs a PayOS payment request payload using the canonical alphabetically sorted fields.
pub fn sign_payment_request(
    checksum_key: &str,
    amount: i64,
    cancel_url: &str,
    description: &str,
    order_code: i64,
    return_url: &str,
) -> String {
    let sign_str = format!(
        "amount={amount}&cancelUrl={cancel_url}&description={description}&orderCode={order_code}&returnUrl={return_url}"
    );
    hmac_sha256_hex(checksum_key, &sign_str)
}

fn sort_json_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let sorted: serde_json::Map<String, Value> = map
                .iter()
                .map(|(k, v)| (k.clone(), sort_json_value(v)))
                .collect::<BTreeMap<String, Value>>()
                .into_iter()
                .collect();
            Value::Object(sorted)
        }
        Value::Array(items) => Value::Array(items.iter().map(sort_json_value).collect()),
        other => other.clone(),
    }
}

fn stringify_payos_field(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => s.clone(),
        Value::Array(_) | Value::Object(_) => {
            serde_json::to_string(&sort_json_value(value)).unwrap_or_default()
        }
    }
}

/// Builds the alphabetically sorted `key=value&...` canonical string for a PayOS `data` map.
pub fn canonicalize_payos_data(data: &Map<String, Value>) -> String {
    let mut keys: Vec<&String> = data.keys().collect();
    keys.sort();

    keys.into_iter()
        .map(|key| {
            let val = data.get(key).map(stringify_payos_field).unwrap_or_default();
            format!("{key}={val}")
        })
        .collect::<Vec<_>>()
        .join("&")
}

/// Computes the PayOS HMAC-SHA256 signature for a `data` object map.
pub fn sign_payos_data_map(checksum_key: &str, data: &Map<String, Value>) -> String {
    let canonical = canonicalize_payos_data(data);
    hmac_sha256_hex(checksum_key, &canonical)
}

/// Verifies a PayOS webhook `data` object against `signature` in constant time.
pub fn verify_webhook_data_signature(
    checksum_key: &str,
    data: &Map<String, Value>,
    signature: &str,
) -> bool {
    let normalized_sig = signature.trim().to_ascii_lowercase();
    if normalized_sig.is_empty() {
        return false;
    }

    let expected = sign_payos_data_map(checksum_key, data);
    expected.as_bytes().ct_eq(normalized_sig.as_bytes()).into()
}

/// Verifies a complete PayOS webhook JSON body (`{ data: {...}, signature: "..." }`).
pub fn verify_webhook_signature(checksum_key: &str, webhook_body: &Value) -> bool {
    let Some(signature) = webhook_body.get("signature").and_then(Value::as_str) else {
        return false;
    };
    let Some(data) = webhook_body.get("data").and_then(Value::as_object) else {
        return false;
    };
    verify_webhook_data_signature(checksum_key, data, signature)
}
