pub const DEFAULT_ROLE: &str = "default";

pub const DISCORD_ROLE_HIERARCHY: [&str; 13] = [
    "Owner",
    "Administrator",
    "Cán Bộ",
    "Hảo Hán Bot",
    "Helper",
    "HaoHan Support",
    "Donator",
    "Animator",
    "Booster",
    "Dev",
    "Youtuber",
    "Emoji Man",
    "Members",
];

/// Resolves the highest-priority role from `DISCORD_ROLE_HIERARCHY`
/// using Unicode case-insensitive comparison, falling back to `"default"`.
pub fn determine_highest_role<S: AsRef<str>>(role_names: &[S]) -> &'static str {
    let lower_roles: Vec<String> = role_names
        .iter()
        .map(|name| name.as_ref().to_lowercase())
        .collect();

    for &role in &DISCORD_ROLE_HIERARCHY {
        let target = role.to_lowercase();
        if lower_roles.iter().any(|candidate| candidate == &target) {
            return role;
        }
    }

    DEFAULT_ROLE
}
