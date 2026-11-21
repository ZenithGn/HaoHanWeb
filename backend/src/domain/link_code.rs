use rand::Rng;

pub const LINK_CODE_CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
pub const LINK_CODE_LEN: usize = 6;

/// Generates a 6-character CSPRNG link code excluding ambiguous characters (`O`, `0`, `I`, `1`).
pub fn generate_link_code() -> String {
    let mut rng = rand::rngs::OsRng;
    let mut out = String::with_capacity(LINK_CODE_LEN);
    for _ in 0..LINK_CODE_LEN {
        let idx = rng.gen_range(0..LINK_CODE_CHARSET.len());
        out.push(LINK_CODE_CHARSET[idx] as char);
    }
    out
}
