#!/usr/bin/env bash
# Run this in Terminal AFTER Cursor crashes (with Cursor closed).
# Prints the last crash-related lines from Cursor's logs so you can see the reason before reopening.

CURSOR_LOGS="${HOME}/Library/Application Support/Cursor/logs"
if [[ ! -d "$CURSOR_LOGS" ]]; then
  echo "Cursor logs not found at: $CURSOR_LOGS"
  exit 1
fi

# Latest session = most recent timestamped folder
LATEST=$(find "$CURSOR_LOGS" -maxdepth 1 -type d -name "20*" | sort -r | head -1)
if [[ -z "$LATEST" ]]; then
  echo "No session folders found under $CURSOR_LOGS"
  exit 1
fi

echo "=== Cursor crash log (latest session: $(basename "$LATEST")) ==="
echo ""

# Main process log – often has renderer crash / exit reason
MAIN_LOG="$LATEST/main.log"
if [[ -f "$MAIN_LOG" ]]; then
  echo "--- main.log (last crash/exit/renderer/error lines) ---"
  grep -i -E "crash|exit|killed|reason|code|renderer|terminated|error|fatal|signal" "$MAIN_LOG" 2>/dev/null | tail -50
  echo ""
fi

# Latest window's renderer log – renderer crashes show here
for W in "$LATEST"/window*; do
  [[ -d "$W" ]] || continue
  R="$W/renderer.log"
  if [[ -f "$R" ]]; then
    echo "--- $(basename "$W")/renderer.log (last error/crash lines) ---"
    grep -i -E "error|crash|exception|fatal|killed|signal|OOM|memory" "$R" 2>/dev/null | tail -30
    echo ""
  fi
done

# If nothing found, show last 30 lines of main.log
if [[ -f "$MAIN_LOG" ]]; then
  echo "--- main.log (last 30 lines) ---"
  tail -30 "$MAIN_LOG"
fi

echo ""
echo "Full logs: $LATEST"
