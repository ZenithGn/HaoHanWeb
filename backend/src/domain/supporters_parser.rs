use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::OnceLock;

use regex::Regex;
use serde::{Deserialize, Serialize};

pub const MANUAL_MESSAGES: [&str; 2] = [
    concat!(
        "Trang 1\n",
        "@Pico | PicoXSVipMax - 3,550,000 VND ( TYSM )\n",
        "@Gờ không inn | Ginkei - 50,000 VND\n",
        "@miCa | mica_san - 150,000 VND\n",
        "@Cowsep | Cowsep2021 - 50,000 VND\n",
        "@Miophilk | Miophilkv3 - 40,000 VND\n",
        "@Eum ba pe | paindestroyleaf - 20,000 VND\n",
        "@Deleted User#0000 | Kuangg_VN - 60,000 VND\n",
        "@a  | Tuckii - 250,000 VND\n",
        "@Mizu#9504 | FishSeller - 30,000 VND\n",
        "@H | ILoveLinh - 170,000 VND\n",
        "@Hảo Thật Đấy(REHAB) | satmamama - 40,000 VND\n",
        "@Deleted User#0000 | NgMinhDuckAnh - 70,000 VND\n",
        "@hamjang#4710 | hamjang - 20,000 VND\n",
        "@imsosad | hoanghydro - 150,000 VND\n",
        "@mệt | D3MON_VN - 70,000 VND\n",
        "@kyon5668 | CS02 - 190,000 VND\n",
        "@unknown-user | JUnLI - 400,000 VND\n",
        "@vuphuongnam_#0 | Zz_South_zZ - 10,000 VND\n",
        "@᲼᲼᲼᲼᲼#3566 | dadadio - 100,000 VND\n",
        "@Deleted User#0000 | NotLynnZ - 30,000 VND\n",
    ),
    concat!(
        "Trang 2\n",
        "@Chào Con Cặc Gì Mà Chào | HLinh_2k4 - 20,000 VND\n",
        "@\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ | 50,000 VND\n",
        "@shon | 10,000 VND\n",
        "@em cy cay | 10,000 VND\n",
        "@Ramon | 0Ramen - 100,000 VND\n",
        "@minerwoftkk | 50,000 VND\n",
        "@Deleted User#0000 | 70,000 VND\n",
        "@dan choi nam dinh™ | 50,000 VND + 2 ảnh gái alimi cho owner (60,000)\n",
        "@song#5482 | 20,000 VND\n",
        "@Thỏ | TanBoiNice - 50,000 VND\n",
        "@Ender_Dragon | Ender_Dragonn - 50,000 VND\n",
        "@Miophilk | Miophilk - 100,000 VND\n",
        "@Mai Linh#4429 | Mai_Linh - 50,000 VND\n",
        "@Bé Cá Bú Đá | Jh7xn - 20,000 VND\n",
        "@sicubidu - 0Clone | 100k card | 1/7/23\n",
        "@WAT - WAT | 100k\n",
        "@Duc | 10,000 VND\n",
        "@ohtanisvibrator | 50,000 VND\n",
        "@!  DuckAnh | 100,000 VND\n",
    ),
];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MentionProfile {
    pub discord_id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub accent_color: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DiscordMessageInput {
    pub content: String,
    #[serde(default)]
    pub mentions: Vec<MentionProfile>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SupporterEntry {
    pub display_name: String,
    pub username: String,
    pub minecraft_name: Option<String>,
    pub discord_id: Option<String>,
    pub role: String,
    pub amount: i64,
    pub entries: i64,
    pub avatar_url: Option<String>,
    pub banner_url: Option<String>,
    pub accent_color: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SupporterPageSummary {
    pub number: u32,
    pub count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ParsedSupportersPayload {
    pub supporters: Vec<SupporterEntry>,
    pub pages: Vec<SupporterPageSummary>,
    pub source: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AmountMatch {
    pub index: usize,
    pub value: i64,
}

fn codeblock_start_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)^```[a-z]*\s*").expect("valid regex"))
}

fn quote_prefix_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^>\s*").expect("valid regex"))
}

fn numbered_list_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^\d+\.\s*").expect("valid regex"))
}

fn page_header_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)^Trang\s+(\d+)").expect("valid regex"))
}

fn amount_k_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)(\d[\d.,]*)\s*k\b").expect("valid regex"))
}

fn amount_vnd_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)(\d[\d.,]*)\s*(?:VND|VNĐ|đ)\b").expect("valid regex"))
}

fn amount_paren_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\((\d[\d.,]*)\)").expect("valid regex"))
}

fn anchored_mention_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"^<@!?(\d+)>$").expect("valid regex"))
}

fn any_mention_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"<@!?(\d+)>").expect("valid regex"))
}

/// Normalizes a single Discord message line by stripping markdown code fences, quotes, and list prefixes.
pub fn normalize_discord_line(line: &str) -> String {
    let s = line.trim();
    let s = codeblock_start_re().replace(s, "");
    let s = s.strip_suffix("```").unwrap_or(&s);
    let s = quote_prefix_re().replace(s, "");
    let s = numbered_list_re().replace(&s, "");
    s.trim().to_string()
}

fn parse_digits_amount(raw: &str) -> i64 {
    let digits: String = raw.chars().filter(char::is_ascii_digit).collect();
    if digits.is_empty() {
        0
    } else {
        digits.parse::<i64>().unwrap_or(0)
    }
}

/// Extracts all donation amounts (`<n>k`, `<n> VND|VNĐ|đ`, `(<n>)`) with their start byte offsets.
pub fn extract_amounts(line: &str) -> Vec<AmountMatch> {
    let mut amounts = Vec::new();

    for caps in amount_k_re().captures_iter(line) {
        if let (Some(full), Some(num)) = (caps.get(0), caps.get(1)) {
            amounts.push(AmountMatch {
                index: full.start(),
                value: parse_digits_amount(num.as_str()).saturating_mul(1000),
            });
        }
    }

    for caps in amount_vnd_re().captures_iter(line) {
        if let (Some(full), Some(num)) = (caps.get(0), caps.get(1)) {
            amounts.push(AmountMatch {
                index: full.start(),
                value: parse_digits_amount(num.as_str()),
            });
        }
    }

    for caps in amount_paren_re().captures_iter(line) {
        if let (Some(full), Some(num)) = (caps.get(0), caps.get(1)) {
            amounts.push(AmountMatch {
                index: full.start(),
                value: parse_digits_amount(num.as_str()),
            });
        }
    }

    let mut seen = HashSet::new();
    amounts.retain(|m| seen.insert((m.index, m.value)));
    amounts
}

fn clean_name(value: &str, mentions: &HashMap<String, MentionProfile>) -> String {
    let stripped = value.strip_prefix('@').unwrap_or(value);
    let trimmed = stripped
        .trim_end_matches(|c: char| matches!(c, '-' | '+' | ',') || c.is_whitespace())
        .trim();

    if let Some(caps) = anchored_mention_re().captures(trimmed)
        && let Some(id) = caps.get(1).map(|m| m.as_str())
        && let Some(profile) = mentions.get(id)
        && !profile.name.trim().is_empty()
    {
        return profile.name.clone();
    }

    trimmed.to_string()
}

/// Splits `name_part` on `|` into `(display_name, minecraft_name)` and resolves `<@id>` mentions.
pub fn split_names(
    name_part: &str,
    mentions: &HashMap<String, MentionProfile>,
) -> (String, Option<String>) {
    if name_part.contains('|') {
        let parts: Vec<&str> = name_part.split('|').map(str::trim).collect();
        let display_name = clean_name(parts.first().copied().unwrap_or(""), mentions);
        let mc_joined = if parts.len() > 1 {
            parts[1..].join(" | ")
        } else {
            String::new()
        };
        let mc_clean = clean_name(&mc_joined, mentions);
        let minecraft_name = if mc_clean.is_empty() {
            None
        } else {
            Some(mc_clean)
        };
        (display_name, minecraft_name)
    } else {
        (clean_name(name_part, mentions), None)
    }
}

fn first_mention_id(name_part: &str) -> Option<&str> {
    any_mention_re()
        .captures(name_part)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str())
}

fn non_empty_opt(val: Option<&String>) -> Option<String> {
    val.map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(ToString::to_string)
}

/// Parses a single normalized supporter line using resolved mention metadata.
pub fn parse_supporter_line(
    line: &str,
    mentions: &HashMap<String, MentionProfile>,
) -> Option<SupporterEntry> {
    let amounts = extract_amounts(line);
    if amounts.is_empty() {
        return None;
    }

    let first_amount_index = amounts.iter().map(|a| a.index).min()?;
    let raw_prefix = line.get(..first_amount_index)?;
    let without_leading_at = raw_prefix.strip_prefix('@').unwrap_or(raw_prefix);
    let name_part = without_leading_at
        .trim_end_matches(|c: char| matches!(c, '-' | '+' | '|' | ',') || c.is_whitespace())
        .trim();

    if name_part.is_empty() {
        return None;
    }

    let (mut display_name, minecraft_name) = split_names(name_part, mentions);
    if display_name.is_empty() {
        display_name = minecraft_name
            .clone()
            .unwrap_or_else(|| "Unknown supporter".to_string());
    }

    let mention_id = first_mention_id(name_part);
    let mention = mention_id.and_then(|id| mentions.get(id));

    let discord_id = mention
        .and_then(|m| non_empty_opt(Some(&m.discord_id)))
        .or_else(|| mention_id.map(ToString::to_string));
    let avatar_url = mention.and_then(|m| non_empty_opt(m.avatar_url.as_ref()));
    let banner_url = mention.and_then(|m| non_empty_opt(m.banner_url.as_ref()));
    let accent_color = mention.and_then(|m| m.accent_color);

    let username = minecraft_name
        .clone()
        .unwrap_or_else(|| display_name.clone());
    let total_amount: i64 = amounts
        .iter()
        .fold(0i64, |acc, a| acc.saturating_add(a.value));

    Some(SupporterEntry {
        display_name,
        username,
        minecraft_name,
        discord_id,
        role: "Donator".to_string(),
        amount: total_amount,
        entries: 1,
        avatar_url,
        banner_url,
        accent_color,
    })
}

/// Extracts `Trang N` pages and parsed supporter entries across a slice of Discord messages.
pub fn extract_pages(messages: &[DiscordMessageInput]) -> Vec<(u32, Vec<SupporterEntry>)> {
    let mut pages: BTreeMap<u32, Vec<SupporterEntry>> = BTreeMap::new();

    for message in messages {
        let mentions: HashMap<String, MentionProfile> = message
            .mentions
            .iter()
            .map(|m| (m.discord_id.clone(), m.clone()))
            .collect();

        let mut current_page: Option<u32> = None;

        for raw_line in message.content.lines() {
            let stripped = normalize_discord_line(raw_line);
            if stripped.is_empty() {
                continue;
            }

            if let Some(caps) = page_header_re().captures(&stripped)
                && let Some(page_num) = caps.get(1).and_then(|m| m.as_str().parse::<u32>().ok())
            {
                current_page = Some(page_num);
                pages.entry(page_num).or_default();
                continue;
            }

            let Some(page_num) = current_page else {
                continue;
            };

            if let Some(supporter) = parse_supporter_line(&stripped, &mentions) {
                pages.entry(page_num).or_default().push(supporter);
            }
        }
    }

    pages.into_iter().collect()
}

pub fn is_generic_display_name(display_name: &str) -> bool {
    let trimmed = display_name.trim();
    trimmed.eq_ignore_ascii_case("deleted user#0000")
        || trimmed.eq_ignore_ascii_case("unknown supporter")
}

fn canonical_merge_key(supporter: &SupporterEntry) -> String {
    let key_source = supporter
        .discord_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| {
            if is_generic_display_name(&supporter.display_name) {
                supporter
                    .minecraft_name
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
            } else {
                let dn = supporter.display_name.trim();
                if dn.is_empty() { None } else { Some(dn) }
            }
        })
        .or_else(|| {
            supporter
                .minecraft_name
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
        })
        .unwrap_or(supporter.username.as_str());

    key_source
        .to_lowercase()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

/// Merges duplicate supporters by canonical key and sorts by `amount DESC`, `display_name.to_lowercase() ASC`.
pub fn merge_supporters(supporters: Vec<SupporterEntry>) -> Vec<SupporterEntry> {
    let mut merged: HashMap<String, SupporterEntry> = HashMap::new();

    for mut supporter in supporters {
        supporter.minecraft_name = supporter.minecraft_name.filter(|s| !s.trim().is_empty());
        supporter.discord_id = supporter.discord_id.filter(|s| !s.trim().is_empty());
        supporter.avatar_url = supporter.avatar_url.filter(|s| !s.trim().is_empty());
        supporter.banner_url = supporter.banner_url.filter(|s| !s.trim().is_empty());
        if supporter.role.trim().is_empty() {
            supporter.role = "Donator".to_string();
        }

        let key = canonical_merge_key(&supporter);
        if let Some(existing) = merged.get_mut(&key) {
            existing.amount = existing.amount.saturating_add(supporter.amount);
            existing.entries = existing.entries.saturating_add(supporter.entries);
            if existing.display_name.trim().is_empty() {
                existing.display_name = supporter.display_name;
            }
            if existing.minecraft_name.is_none() {
                existing.minecraft_name = supporter.minecraft_name;
            }
            if existing.discord_id.is_none() {
                existing.discord_id = supporter.discord_id;
            }
            existing.username = existing
                .minecraft_name
                .clone()
                .unwrap_or_else(|| existing.display_name.clone());
            if existing.role.trim().is_empty() {
                existing.role = "Donator".to_string();
            }
            if existing.avatar_url.is_none() {
                existing.avatar_url = supporter.avatar_url;
            }
            if existing.banner_url.is_none() {
                existing.banner_url = supporter.banner_url;
            }
            if existing.accent_color.is_none() {
                existing.accent_color = supporter.accent_color;
            }
        } else {
            merged.insert(key, supporter);
        }
    }

    let mut out: Vec<SupporterEntry> = merged.into_values().collect();
    out.sort_by(|a, b| {
        b.amount.cmp(&a.amount).then_with(|| {
            a.display_name
                .to_lowercase()
                .cmp(&b.display_name.to_lowercase())
        })
    });
    out
}

/// Builds a `ParsedSupportersPayload` from Discord messages, source label, and ISO-8601 timestamp.
pub fn build_supporters_payload(
    messages: &[DiscordMessageInput],
    source: &str,
    updated_at: String,
) -> ParsedSupportersPayload {
    let extracted = extract_pages(messages);
    let pages = extracted
        .iter()
        .map(|(number, entries)| SupporterPageSummary {
            number: *number,
            count: entries.len(),
        })
        .collect();
    let flat: Vec<SupporterEntry> = extracted
        .into_iter()
        .flat_map(|(_, entries)| entries)
        .collect();
    let supporters = merge_supporters(flat);

    ParsedSupportersPayload {
        supporters,
        pages,
        source: source.to_string(),
        updated_at,
    }
}

/// Converts the static fallback `MANUAL_MESSAGES` into `DiscordMessageInput` records.
pub fn manual_messages_input() -> Vec<DiscordMessageInput> {
    MANUAL_MESSAGES
        .iter()
        .map(|text| DiscordMessageInput {
            content: (*text).to_string(),
            mentions: Vec::new(),
        })
        .collect()
}
