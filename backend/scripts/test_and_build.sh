#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$BACKEND_DIR"

BANNER_WIDTH=91

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

print_banner() {
    local title="$1"
    local color="$2"
    local inner=" $title "
    local inner_len=${#inner}
    if (( inner_len >= BANNER_WIDTH )); then
        printf "%b%s%b\n" "$color" "$inner" "$RESET"
        return
    fi
    local total_pad=$(( BANNER_WIDTH - inner_len ))
    local left_pad=$(( total_pad / 2 ))
    local right_pad=$(( total_pad - left_pad ))
    local left_eq right_eq
    left_eq=$(printf '%*s' "$left_pad" '' | tr ' ' '=')
    right_eq=$(printf '%*s' "$right_pad" '' | tr ' ' '=')
    printf "%b%s%s%s%b\n" "$color" "$left_eq" "$inner" "$right_eq" "$RESET"
}

now_ns() {
    if date +%s%N >/dev/null 2>&1; then
        local ns
        ns=$(date +%s%N)
        if [[ "$ns" =~ ^[0-9]+$ ]]; then
            echo "$ns"
            return
        fi
    fi
    echo "$(( $(date +%s) * 1000000000 ))"
}

format_elapsed() {
    local start_ns="$1"
    local end_ns="$2"
    awk -v s="$start_ns" -v e="$end_ns" 'BEGIN { printf "%.2fs", (e - s) / 1000000000.0 }'
}

RUSTC_VER="$(rustc --version 2>/dev/null || echo 'unknown')"
CARGO_VER="$(cargo --version 2>/dev/null || echo 'unknown')"
OS_DESC="$(uname -srm 2>/dev/null || uname -a)"

print_banner "test session starts" "$BOLD"
printf "platform %s -- %s, %s -- %s\n" "$OS_DESC" "$RUSTC_VER" "$CARGO_VER" "$BACKEND_DIR"

TEST_LOG="$(mktemp)"
trap 'rm -f "$TEST_LOG"' EXIT

START_TEST_NS="$(now_ns)"
cargo test --color=never >"$TEST_LOG" 2>&1
TEST_EXIT=$?
END_TEST_NS="$(now_ns)"
TEST_ELAPSED="$(format_elapsed "$START_TEST_NS" "$END_TEST_NS")"

declare -a SUITES=()
declare -a NAMES=()
declare -a STATUSES=()

CURRENT_SUITE="unknown"
while IFS= read -r line; do
    if [[ "$line" =~ ^[[:space:]]*Running[[:space:]]+(unittests[[:space:]]+)?([^[:space:]\(]+\.rs)[[:space:]]+\( ]]; then
        CURRENT_SUITE="${BASH_REMATCH[2]//\\//}"
        continue
    fi
    if [[ "$line" =~ ^[[:space:]]*Doc-tests[[:space:]]+([^[:space:]]+) ]]; then
        CURRENT_SUITE="doc-tests/${BASH_REMATCH[1]}"
        continue
    fi
    if [[ "$line" =~ ^test[[:space:]]+(.+)[[:space:]]+\.\.\.[[:space:]]+(ok|FAILED|ignored)[[:space:]]*$ ]]; then
        SUITES+=("$CURRENT_SUITE")
        NAMES+=("${BASH_REMATCH[1]}")
        STATUSES+=("${BASH_REMATCH[2]}")
    fi
done < "$TEST_LOG"

TOTAL=${#NAMES[@]}
printf "collected %d items\n\n" "$TOTAL"

PASSED=0
FAILED=0
IGNORED=0

for (( i=0; i<TOTAL; i++ )); do
    idx=$(( i + 1 ))
    pct=$(( (idx * 100) / TOTAL ))
    printf -v pct_text "[%3d%%]" "$pct"

    suite="${SUITES[$i]}"
    name="${NAMES[$i]}"
    raw_status="${STATUSES[$i]}"

    case "$raw_status" in
        ok)
            PASSED=$(( PASSED + 1 ))
            status_word="PASSED"
            status_color="$GREEN"
            ;;
        FAILED)
            FAILED=$(( FAILED + 1 ))
            status_word="FAILED"
            status_color="$RED"
            ;;
        ignored)
            IGNORED=$(( IGNORED + 1 ))
            status_word="SKIPPED"
            status_color="$YELLOW"
            ;;
    esac

    prefix="${suite}::${name} "
    used_len=$(( ${#prefix} + ${#status_word} ))
    gap=$(( BANNER_WIDTH - used_len - ${#pct_text} ))
    if (( gap < 1 )); then
        gap=1
    fi
    spaces=$(printf '%*s' "$gap" '')
    printf "%s%b%s%b%s%b%s%b\n" "$prefix" "$status_color" "$status_word" "$RESET" "$spaces" "$CYAN" "$pct_text" "$RESET"
done

printf "\n"

if (( TEST_EXIT != 0 || FAILED > 0 || TOTAL == 0 )); then
    cat "$TEST_LOG" >&2
    if (( TOTAL == 0 )); then
        print_banner "0 tests collected (exit $TEST_EXIT) in $TEST_ELAPSED" "$RED"
    else
        print_banner "$FAILED failed, $PASSED passed in $TEST_ELAPSED" "$RED"
    fi
    exit 1
fi

if (( IGNORED > 0 )); then
    print_banner "$PASSED passed, $IGNORED skipped in $TEST_ELAPSED" "$GREEN"
else
    print_banner "$PASSED passed in $TEST_ELAPSED" "$GREEN"
fi
printf "\n"

printf "%b[2/4] Running cargo fmt --check...%b\n" "$CYAN" "$RESET"
cargo fmt --check || { printf "%bERROR: cargo fmt --check failed.%b\n" "$RED" "$RESET"; exit 1; }

printf "%b[3/4] Running cargo clippy --all-targets -- -D warnings...%b\n" "$CYAN" "$RESET"
cargo clippy --all-targets -- -D warnings || { printf "%bERROR: cargo clippy failed.%b\n" "$RED" "$RESET"; exit 1; }

printf "%b[4/4] Running cargo build --release...%b\n" "$CYAN" "$RESET"
START_BUILD_NS="$(now_ns)"
cargo build --release || { printf "%bERROR: cargo build --release failed.%b\n" "$RED" "$RESET"; exit 1; }
END_BUILD_NS="$(now_ns)"
BUILD_ELAPSED="$(format_elapsed "$START_BUILD_NS" "$END_BUILD_NS")"

BIN_PATH="$BACKEND_DIR/target/release/haohan-backend"
if [[ ! -f "$BIN_PATH" && -f "$BIN_PATH.exe" ]]; then
    BIN_PATH="$BIN_PATH.exe"
fi
if [[ ! -f "$BIN_PATH" ]]; then
    printf "%bERROR: Release binary not found at %s%b\n" "$RED" "$BIN_PATH" "$RESET"
    exit 1
fi

SIZE_BYTES=$(wc -c < "$BIN_PATH" | tr -d '[:space:]')
SIZE_MB=$(awk -v b="$SIZE_BYTES" 'BEGIN { printf "%.2f", b / 1048576.0 }')

printf "\n"
print_banner "CI/CD BUILD SUMMARY" "$GREEN"
printf "Tests passed   : %d / %d (%s)\n" "$PASSED" "$TOTAL" "$TEST_ELAPSED"
printf "Fmt & Clippy   : OK (-D warnings)\n"
printf "Release build  : OK (%s)\n" "$BUILD_ELAPSED"
printf "Release binary : %s\n" "$BIN_PATH"
printf "Binary size    : %s bytes (%s MB)\n" "$SIZE_BYTES" "$SIZE_MB"
print_banner "ALL CHECKS PASSED" "$GREEN"
