#!/bin/bash

# Cloudflare Tunnel Buddy - Complete Build Script
# This script sets up the app bundle, generates icons, and builds everything

set -e  # Exit on any error

echo "🚀 Building Cloudflare Tunnel Buddy..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Setup app bundle structure
echo "🏗️  Setting up app bundle structure..."
APP_PATH="Cloudflare Tunnel Buddy.app"
CONTENTS_PATH="$APP_PATH/Contents"
MACOS_PATH="$CONTENTS_PATH/MacOS"
RESOURCES_PATH="$CONTENTS_PATH/Resources"

# Create app bundle structure
mkdir -p "$MACOS_PATH"
mkdir -p "$RESOURCES_PATH"

# Create Info.plist
cat > "$CONTENTS_PATH/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Cloudflare Tunnel Buddy</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.cloudflare-tunnel-buddy</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Cloudflare Tunnel Buddy</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleDisplayName</key>
    <string>Cloudflare Tunnel Buddy</string>
    <key>CFBundleGetInfoString</key>
    <string>Cloudflare Tunnel Buddy 1.0.0</string>
    <key>NSHumanReadableCopyright</key>
    <string>© 2024 Cloudflare Tunnel Buddy</string>
</dict>
</plist>
EOF

# Create launcher script
cat > "$MACOS_PATH/Cloudflare Tunnel Buddy" << 'EOF'
#!/bin/bash

# Cloudflare Tunnel Buddy - macOS App Launcher
# This script opens Terminal and runs the interactive CLI

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENTS_DIR="$(dirname "$SCRIPT_DIR")"
CLI_SCRIPT="$CONTENTS_DIR/Resources/cf-tunnel-buddy.cjs"

# Check if the CLI script exists
if [ ! -f "$CLI_SCRIPT" ]; then
    osascript -e 'display dialog "Error: CLI script not found. Please rebuild Cloudflare Tunnel Buddy." with title "Cloudflare Tunnel Buddy" buttons {"OK"} default button "OK" with icon stop'
    exit 1
fi

# Create a terminal script that will source the user's shell environment
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << INNER_EOF
#!/bin/bash

# Source shell profile to get proper PATH (for Homebrew, nvm, etc.)
if [ -f "\$HOME/.zshrc" ]; then
    source "\$HOME/.zshrc" 2>/dev/null
elif [ -f "\$HOME/.bashrc" ]; then
    source "\$HOME/.bashrc" 2>/dev/null
elif [ -f "\$HOME/.bash_profile" ]; then
    source "\$HOME/.bash_profile" 2>/dev/null
fi

# Also add common Node.js locations to PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:\$HOME/.nvm/versions/node/*/bin:\$PATH"

# Set terminal title and clear screen
echo -ne "\033]0;Cloudflare Tunnel Buddy\007"
clear

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed."
    echo ""
    echo "Please install Node.js 20+ from https://nodejs.org/"
    echo "Or via Homebrew: brew install node"
    echo ""
    echo "Press any key to exit..."
    read -n 1 -s
    exit 1
fi

# Show welcome message
echo "🌟 Welcome to Cloudflare Tunnel Buddy!"
echo "Interactive CLI for managing Cloudflare tunnels"
echo ""
echo "💡 Tips:"
echo "   • Use arrow keys to navigate menus"
echo "   • Select 'Go back' to return to previous steps"
echo "   • Press Ctrl+C to exit at any time"
echo ""
echo "Starting..."
sleep 1

# Run the interactive CLI
export NODE_NO_WARNINGS=1
cd "$CONTENTS_DIR"
if node "$CLI_SCRIPT"; then
    echo ""
else
    echo ""
    echo "❌ An error occurred. Please check the logs above."
    echo ""
fi

echo "Press any key to exit..."
read -n 1 -s
INNER_EOF

# Make the temp script executable
chmod +x "$TEMP_SCRIPT"

# Open Terminal with default settings
osascript << APPLESCRIPT_EOF
tell application "Terminal"
    activate
    do script "$TEMP_SCRIPT"
end tell
APPLESCRIPT_EOF

# Clean up the temporary script after a delay
(sleep 10 && rm -f "$TEMP_SCRIPT") &
EOF

# Make launcher script executable
chmod +x "$MACOS_PATH/Cloudflare Tunnel Buddy"

echo "✅ App bundle structure created"

# Check for required tools
echo "🔍 Checking dependencies..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

# Check npm
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo
    echo "📦 Installing dependencies..."
    npm install
fi

# Copy app icon
echo
echo "🎨 Setting up app icon..."

if [ -f "AppIcon.icns" ]; then
    cp "AppIcon.icns" "$RESOURCES_PATH/AppIcon.icns"
    echo "✅ App icon copied successfully"
else
    echo "❌ AppIcon.icns not found in project root"
    echo "   The app will use the default system icon"
fi

# Build the application
echo
echo "🔨 Building application..."
npm run build

# Verify the app bundle
echo
echo "🔍 Verifying app bundle..."

APP_PATH="Cloudflare Tunnel Buddy.app"
if [ -d "$APP_PATH" ]; then
    echo "✅ App bundle exists"
    
    if [ -f "$APP_PATH/Contents/Resources/cf-tunnel-buddy.cjs" ]; then
        echo "✅ Executable exists"
        
        # Check executable permissions
        if [ -x "$APP_PATH/Contents/Resources/cf-tunnel-buddy.cjs" ]; then
            echo "✅ Executable has correct permissions"
        else
            echo "🔧 Fixing executable permissions..."
            chmod +x "$APP_PATH/Contents/Resources/cf-tunnel-buddy.cjs"
        fi
        
        # Check launcher script
        if [ -f "$APP_PATH/Contents/MacOS/Cloudflare Tunnel Buddy" ]; then
            echo "✅ Launcher script exists"
            
            if [ -x "$APP_PATH/Contents/MacOS/Cloudflare Tunnel Buddy" ]; then
                echo "✅ Launcher script has correct permissions"
            else
                echo "🔧 Fixing launcher script permissions..."
                chmod +x "$APP_PATH/Contents/MacOS/Cloudflare Tunnel Buddy"
            fi
        else
            echo "❌ Launcher script missing"
            exit 1
        fi
        
        # Check Info.plist
        if [ -f "$APP_PATH/Contents/Info.plist" ]; then
            echo "✅ Info.plist exists"
        else
            echo "❌ Info.plist missing"
            exit 1
        fi
        
        # Check icon
        if [ -f "$APP_PATH/Contents/Resources/AppIcon.icns" ]; then
            echo "✅ App icon exists"
        else
            echo "⚠️  App icon missing"
        fi
        
    else
        echo "❌ Executable missing"
        exit 1
    fi
else
    echo "❌ App bundle missing"
    exit 1
fi

echo
echo "🎉 Build completed successfully!"
echo
echo "📱 App location: $APP_PATH"
echo "💡 Double-click the app to launch"
echo
echo "🚀 To test the app:"
echo "   open '$APP_PATH'"
echo