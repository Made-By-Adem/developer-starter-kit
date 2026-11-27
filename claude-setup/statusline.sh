#!/usr/bin/env bash
# Claude Code status line: two lines with model, context, rate limits, git and session info.
# Needs bash, node and git. Wire it up in ~/.claude/settings.json under "statusLine".

input=$(cat)

eval "$(echo "$input" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const d = JSON.parse(chunks.join(''));
  const g = (path, fallback = '') => {
    try { return path.split('.').reduce((o, k) => o[k], d) ?? fallback; }
    catch { return fallback; }
  };
  const lines = [];
  lines.push('model_name=' + JSON.stringify(g('model.display_name', 'Claude')));
  lines.push('ctx_size=' + JSON.stringify(String(g('context_window.context_window_size', '0'))));
  lines.push('used_pct=' + JSON.stringify(String(Math.round(Number(g('context_window.used_percentage', 0))))));
  // Current context size in tokens = everything sent on the last request
  const cu = g('context_window.current_usage', null);
  const curTokens = cu
    ? Number(cu.input_tokens || 0) + Number(cu.cache_creation_input_tokens || 0) + Number(cu.cache_read_input_tokens || 0)
    : Math.round(Number(g('context_window.context_window_size', 0)) * Number(g('context_window.used_percentage', 0)) / 100);
  lines.push('ctx_tokens=' + JSON.stringify(String(curTokens)));
  lines.push('five_hr_pct=' + JSON.stringify(String(g('rate_limits.five_hour.used_percentage', ''))));
  lines.push('five_hr_resets=' + JSON.stringify(String(g('rate_limits.five_hour.resets_at', ''))));
  lines.push('seven_day_pct=' + JSON.stringify(String(g('rate_limits.seven_day.used_percentage', ''))));
  lines.push('seven_day_resets=' + JSON.stringify(String(g('rate_limits.seven_day.resets_at', ''))));
  lines.push('duration_ms=' + JSON.stringify(String(g('cost.total_duration_ms', 0))));
  lines.push('lines_added=' + JSON.stringify(String(g('cost.total_lines_added', 0))));
  lines.push('lines_removed=' + JSON.stringify(String(g('cost.total_lines_removed', 0))));
  lines.push('cwd=' + JSON.stringify(g('cwd', g('workspace.current_dir', ''))));
  lines.push('project_dir=' + JSON.stringify(g('workspace.project_dir', g('cwd', ''))));
  lines.push('effort_level=' + JSON.stringify(String(g('effort.level', ''))));
  lines.push('fast_mode=' + JSON.stringify(String(g('fast_mode', false))));
  // Logged-in account: read from the active config dir (CLAUDE_CONFIG_DIR), else ~/.claude.json
  const path = require('path'), os = require('os'), fs = require('fs');
  const dir = process.env.CLAUDE_CONFIG_DIR;
  let email = '';
  for (const f of [dir && path.join(dir, '.claude.json'), path.join(os.homedir(), '.claude.json')].filter(Boolean)) {
    try { email = (JSON.parse(fs.readFileSync(f, 'utf8')).oauthAccount || {}).emailAddress || ''; break; }
    catch {}
  }
  lines.push('account_email=' + JSON.stringify(email.replace(/[\$\`\"\\\\]/g, '')));
  console.log(lines.join('\n'));
});
")"

# --- Colors ---
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
BLUE="\033[34m"
MAGENTA="\033[35m"
DIM="\033[2m"
BOLD="\033[1m"
RESET="\033[0m"
ORANGE="\033[38;5;208m"
SEP=" ${DIM}│${RESET} "

# --- Helper: color by percentage ---
pct_color() {
  local pct=$1
  if [ "$pct" -ge 80 ] 2>/dev/null; then
    echo "$RED"
  elif [ "$pct" -ge 50 ] 2>/dev/null; then
    echo "$YELLOW"
  else
    echo "$GREEN"
  fi
}

# --- Helper: mini bar ---
make_bar() {
  local pct=$1
  local width=${2:-10}
  local filled=$((pct * width / 100))
  local empty=$((width - filled))
  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done
  echo "$bar"
}

# --- Helper: 52425 -> 52K, 1000000 -> 1M ---
fmt_tokens() {
  local n=$1
  if [ "$n" -ge 1000000 ] 2>/dev/null; then
    echo "$((n / 1000000))M"
  elif [ "$n" -ge 1000 ] 2>/dev/null; then
    echo "$((n / 1000))K"
  else
    echo "$n"
  fi
}

# --- Helper: seconds until epoch -> "3d04h" / "2h01m" ---
fmt_countdown() {
  local until=$1
  local now remaining days hours minutes
  now=$(date +%s)
  remaining=$((until - now))
  [ "$remaining" -lt 0 ] && remaining=0
  days=$((remaining / 86400))
  hours=$(( (remaining % 86400) / 3600 ))
  minutes=$(( (remaining % 3600) / 60 ))
  if [ "$days" -gt 0 ]; then
    printf "%dd%02dh" "$days" "$hours"
  else
    printf "%dh%02dm" "$hours" "$minutes"
  fi
}

# --- Model display ---
model_display="$model_name"
ctx_label=$(fmt_tokens "$ctx_size")
[ "$ctx_label" != "0" ] && model_display="${model_display} (${ctx_label})"

# --- Context usage ---
[ -z "$used_pct" ] && used_pct=0
ctx_color=$(pct_color "$used_pct")
ctx_bar=$(make_bar "$used_pct" 10)
ctx_label="${DIM}ctx${RESET}"
[ "$used_pct" -ge 80 ] 2>/dev/null && ctx_label="${RED}${BOLD}⚠ /compact${RESET}"
ctx_section=$(printf "%b %b[%s] %d%%%b ${DIM}%s${RESET}" "$ctx_label" "$ctx_color" "$ctx_bar" "$used_pct" "$RESET" "$(fmt_tokens "$ctx_tokens")")

# --- Rate limits: the higher of the two is the real bottleneck -> bold ---
five_hr_int=""; seven_day_int=""
[ -n "$five_hr_pct" ] && five_hr_int=$(printf "%.0f" "$five_hr_pct")
[ -n "$seven_day_pct" ] && seven_day_int=$(printf "%.0f" "$seven_day_pct")
five_hr_weight=""; seven_day_weight=""
if [ -n "$five_hr_int" ] && [ -n "$seven_day_int" ]; then
  if [ "$seven_day_int" -gt "$five_hr_int" ]; then seven_day_weight="$BOLD"; else five_hr_weight="$BOLD"; fi
fi

five_hr_section=""
if [ -n "$five_hr_int" ]; then
  reset_str=""
  [ -n "$five_hr_resets" ] && reset_str=" $(fmt_countdown "$five_hr_resets")"
  five_hr_section=$(printf "${SEP}${DIM}5h${RESET} %b%b[%s] %d%%${RESET}%s" \
    "$five_hr_weight" "$(pct_color "$five_hr_int")" "$(make_bar "$five_hr_int" 10)" "$five_hr_int" "$reset_str")
fi

seven_day_section=""
if [ -n "$seven_day_int" ]; then
  reset_str=""
  [ -n "$seven_day_resets" ] && reset_str=" $(fmt_countdown "$seven_day_resets")"
  seven_day_section=$(printf "${SEP}${DIM}7d${RESET} %b%b[%s] %d%%${RESET}%s" \
    "$seven_day_weight" "$(pct_color "$seven_day_int")" "$(make_bar "$seven_day_int" 10)" "$seven_day_int" "$reset_str")
fi

# --- Git: branch *changed ↑ahead ↓behind ---
[ -z "$cwd" ] && cwd=$(pwd)
git_section=""
git_branch=$(GIT_OPTIONAL_LOCKS=0 git -C "$cwd" symbolic-ref --short HEAD 2>/dev/null)
if [ -n "$git_branch" ]; then
  # status + ahead/behind are cached per repo for GIT_CACHE_TTL seconds so a big
  # repo never slows down the render (the branch name itself is cheap)
  GIT_CACHE_DIR="$HOME/.claude/cache/statusline"
  GIT_CACHE_TTL=10
  mkdir -p "$GIT_CACHE_DIR" 2>/dev/null
  cache_file="$GIT_CACHE_DIR/$(printf '%s@%s' "$cwd" "$git_branch" | cksum | cut -d' ' -f1)"
  cache_age=$GIT_CACHE_TTL
  if [ -f "$cache_file" ]; then
    cache_age=$(( $(date +%s) - $(stat -f %m "$cache_file" 2>/dev/null || stat -c %Y "$cache_file" 2>/dev/null || echo 0) ))
  fi
  if [ "$cache_age" -lt "$GIT_CACHE_TTL" ]; then
    IFS='|' read -r changed ab < "$cache_file"
  else
    changed=$(GIT_OPTIONAL_LOCKS=0 git -C "$cwd" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    ab=$(GIT_OPTIONAL_LOCKS=0 git -C "$cwd" rev-list --left-right --count '@{u}...HEAD' 2>/dev/null)
    printf '%s|%s' "$changed" "$ab" > "$cache_file" 2>/dev/null
  fi

  git_extra=""
  [ "$changed" -gt 0 ] 2>/dev/null && git_extra+=" ${YELLOW}*${changed}${RESET}"
  if [ -n "$ab" ]; then
    behind=${ab%%[[:space:]]*}
    ahead=${ab##*[[:space:]]}
    [ "$ahead" -gt 0 ] 2>/dev/null && git_extra+=" ${GREEN}↑${ahead}${RESET}"
    [ "$behind" -gt 0 ] 2>/dev/null && git_extra+=" ${RED}↓${behind}${RESET}"
  fi
  git_section=$(printf "${SEP}${CYAN}%s${RESET}%b" "$git_branch" "$git_extra")
fi

# --- Project: name of the folder Claude Code was started in ---
project=""
[ -n "$project_dir" ] && project=$(basename "$project_dir")

# --- Session: duration and lines changed ---
dur_s=$(( ${duration_ms:-0} / 1000 ))
if [ "$dur_s" -ge 3600 ]; then
  dur_str=$(printf "%dh%02dm" $((dur_s / 3600)) $(( (dur_s % 3600) / 60 )))
else
  dur_str=$(printf "%dm" $((dur_s / 60)))
fi
lines_str=""
if [ "${lines_added:-0}" -gt 0 ] || [ "${lines_removed:-0}" -gt 0 ]; then
  lines_str=$(printf " ${GREEN}+%s${RESET}/${RED}-%s${RESET}" "$lines_added" "$lines_removed")
fi

# --- Effort / fast mode ---
mode_str=""
[ -n "$effort_level" ] && mode_str="$effort_level"
[ "$fast_mode" = "true" ] && mode_str="${mode_str:+$mode_str }⚡fast"

# ==========================================================================
# LINE 1: model │ ctx bar tokens │ 5h bar timer │ 7d bar timer │ branch *n ↑ ↓
# ==========================================================================
printf "${BOLD}${GREEN}%s${RESET}" "$model_display"
printf "${SEP}%b" "$ctx_section"
printf "%b" "$five_hr_section"
printf "%b" "$seven_day_section"
printf "%b" "$git_section"
printf "\n"

# ==========================================================================
# LINE 2: account │ project │ duration +/- │ effort
# ==========================================================================
parts=()
if [ -n "$account_email" ]; then
  # Stable color per account, so two accounts are distinguishable at a glance
  account_colors=("\033[1;34m" "\033[1;35m" "\033[1;36m" "\033[1;33m")
  account_color=${account_colors[$(( $(printf '%s' "$account_email" | cksum | cut -d' ' -f1) % ${#account_colors[@]} ))]}
  parts+=("${account_color}${account_email}${RESET}")
fi
[ -n "$project" ] && parts+=("${BOLD}${ORANGE}${project}${RESET}")
parts+=("${DIM}${dur_str}${RESET}${lines_str}")
[ -n "$mode_str" ] && parts+=("${DIM}${mode_str}${RESET}")

line2=""
for p in "${parts[@]}"; do
  [ -n "$line2" ] && line2+="$SEP"
  line2+="$p"
done
printf "%b" "$line2"
