#!/bin/bash

# Setup script for weekly Medusa documentation updates
# This script helps configure automatic weekly updates using cron or launchd (macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_SCRIPT="$SCRIPT_DIR/update-medusa-docs.sh"

echo "🔧 Medusa Documentation Auto-Update Setup"
echo "==========================================="
echo ""

# Make update script executable
chmod +x "$UPDATE_SCRIPT"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - Setting up using launchd..."
    echo ""

    # Create launchd plist
    PLIST_PATH="$HOME/Library/LaunchAgents/com.medusa4wd.docupdate.plist"

    cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.medusa4wd.docupdate</string>
    <key>ProgramArguments</key>
    <array>
        <string>$UPDATE_SCRIPT</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/medusa-doc-update.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/medusa-doc-update-error.log</string>
</dict>
</plist>
EOF

    # Load the launchd job
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"

    echo "✅ Automatic weekly updates configured!"
    echo "Schedule: Every Monday at 9:00 AM"
    echo "Plist location: $PLIST_PATH"
    echo ""
    echo "To manually run the update:"
    echo "  $UPDATE_SCRIPT"
    echo ""
    echo "To disable automatic updates:"
    echo "  launchctl unload $PLIST_PATH"
    echo ""

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux - Setting up using cron..."
    echo ""

    # Add cron job
    CRON_CMD="0 9 * * 1 $UPDATE_SCRIPT"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$UPDATE_SCRIPT"; then
        echo "⚠️  Cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "✅ Cron job added!"
    fi

    echo "Schedule: Every Monday at 9:00 AM"
    echo ""
    echo "To view cron jobs:"
    echo "  crontab -l"
    echo ""
    echo "To manually run the update:"
    echo "  $UPDATE_SCRIPT"
    echo ""

else
    echo "⚠️  Unknown OS. Please set up manually."
    echo ""
    echo "Add this to your scheduler to run weekly:"
    echo "  $UPDATE_SCRIPT"
    echo ""
fi

# Run initial update
echo "Running initial documentation download..."
echo ""
bash "$UPDATE_SCRIPT"

echo ""
echo "✅ Setup complete!"
