<div align="center">

# Cloudflare Tunnel Buddy

<img src="cloudflare-tunnel-buddy.svg" alt="Cloudflare Tunnel Buddy" width="128" height="128">

### 🍎 A native macOS app for managing Cloudflare tunnels with ease

_Double-click to launch an interactive terminal interface for creating, managing, and controlling your Cloudflare tunnels._

![macOS](https://img.shields.io/badge/macOS-10.15+-blue?logo=apple)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-orange)

</div>

## Features

- 🍎 **Native macOS App** - Double-click .app bundle that opens in Terminal
- 🚀 **Interactive Setup** - Guided tunnel creation with step-by-step prompts
- 📋 **Complete Tunnel Management** - Create, edit, remove, start, stop, and list tunnels
- 🔄 **External Tunnel Import** - Discover and import tunnels created outside the app
- ⚡ **Background Tunnels** - Tunnels run in background, returning you to the menu immediately
- 🧭 **Full Navigation** - Back/cancel options throughout all dialogs
- 📊 **Status Monitoring** - Real-time tunnel status with local and Cloudflare sync
- 🔍 **Cloudflared Status** - Check cloudflared installation, authentication, and account info
- 🧹 **Reset Functionality** - Clean up configuration files when needed
- 🎨 **Beautiful Interface** - Colored terminal output with progress indicators

## Prerequisites

- Node.js 20 or higher
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation) installed and accessible in PATH
- Cloudflare account with tunnel permissions

## Getting Started

### Quick Setup

1. **Clone** this repository to your Mac:

   ```bash
   git clone https://github.com/itsmereal/cloudflare-tunnel-buddy.git
   cd cloudflare-tunnel-buddy
   ```

2. **Build the app**:

   ```bash
   ./build.sh
   ```

3. **Launch the app**:
   - Double-click `Cloudflare Tunnel Buddy.app` in Finder
   - Or run: `open "Cloudflare Tunnel Buddy.app"`

The build script will automatically:

- ✅ Install npm dependencies
- ✅ Create the macOS app bundle structure
- ✅ Copy the custom orange tunnel icon
- ✅ Build and bundle all JavaScript code
- ✅ Set proper permissions for macOS

### First Launch

When you first open the app, it will:

1. Check for Node.js and cloudflared requirements
2. Open Terminal with a welcome screen and helpful tips
3. Prompt for Cloudflare authentication if needed
4. Present the main interactive menu with all available options

## How to Use

### Main Menu Options

When you launch the app, you'll see an interactive menu with these options:

🆕 **Create a new tunnel**

- Guided setup for HTTP/HTTPS services
- Support for Local by Flywheel, XAMPP, MAMP, etc.
- Custom URL and hostname configuration
- Automatic DNS routing setup

📋 **List all tunnels**

- View both local and external tunnels
- Shows status, URLs, and source information
- Distinguishes between locally managed and externally created tunnels

▶️ **Start a tunnel**

- Select from available configured tunnels
- Tunnel runs in background
- Returns to menu immediately while tunnel stays active

⏹️ **Stop a tunnel**

- Gracefully stop running tunnels
- Returns to main menu automatically

🔍 **Cloudflared status**

- Check if cloudflared is installed
- View cloudflared version
- Check authentication status
- View account ID and zone information
- List all tunnels in your Cloudflare account with connection status

📊 **Check tunnel status**

- Local process status
- Cloudflare connection status
- Detailed tunnel information

✏️ **Edit a tunnel**

- Modify service URLs
- Update hostnames
- Change DNS routing

🗑️ **Remove a tunnel**

- Delete tunnel configuration
- Remove from Cloudflare (with confirmation)
- Handles both local and external tunnels

🔄 **Import external tunnels**

- Discover tunnels created outside the app
- Bulk import or selective import
- Sync with Cloudflare tunnel list

🧹 **Reset configuration**

- Clean up configuration files
- Remove generated folders
- Fresh start option

### Common Use Cases

#### Local by Flywheel Site

1. **Create tunnel**: Select "Create a new tunnel"
2. **Configure**:
   - Name: `my-site`
   - Service URL: `https://my-site.local` (your Local site domain)
   - Hostname: `my-site.yourdomain.com`
3. **Start**: Select "Start a tunnel" → choose your tunnel
4. **Update**: Update the site url to what you entered as Hostname
5. **Access**: Visit `https://my-site.yourdomain.com`

#### XAMPP/MAMP Development

1. **Create tunnel**: Select "Create a new tunnel"
2. **Configure**:
   - Name: `dev-site`
   - Service URL: `http://localhost:8080` (or your port)
   - Hostname: `dev.yourdomain.com`
3. **Start**: Launch tunnel when ready to share

#### Import Existing Tunnels

1. **Sync**: Select "Import external tunnels"
2. **Choose**: Select tunnels to import or import all
3. **Edit**: Configure URLs for imported tunnels
4. **Use**: Start/stop as normal

## Configuration

The tool stores configuration in `~/.cf-tunnel-buddy/`:

- `tunnels.json` - Tunnel configurations
- `credentials.json` - Cloudflare credentials (managed by cloudflared)

## Development

### Building from Source

The build process is handled by a single script that does everything:

```bash
./build.sh
```

This script will:

- Create the macOS app bundle structure
- Install npm dependencies
- Build and bundle all JavaScript code
- Set executable permissions
- Verify the app is ready to use

### Project Structure

```
├── src/                           # Source code
│   ├── interactive.js             # Main app entry point
│   ├── commands/                  # All tunnel operations
│   ├── utils/                     # Configuration & helpers
│   └── lib/                       # Core tunnel management
├── AppIcon.icns                   # Pre-built app icon
├── build.sh                       # Complete build script
└── Cloudflare Tunnel Buddy.app/   # Generated app bundle
```

### Making Changes

After modifying source code, just run:

```bash
./build.sh
```

The script will rebuild everything and update the app bundle.

## Troubleshooting

### Common Issues

**App won't open**

- Make sure Node.js 20+ is installed
- Right-click the app → "Open" to bypass Gatekeeper if needed

**"cloudflared not found"**

- Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation
- Restart Terminal after installation

**"Please login" or authentication issues**

- The app will guide you through Cloudflare authentication automatically
- Follow the browser prompts when they appear

**Can't see external tunnels**

- Use "Import external tunnels" to discover tunnels created outside the app
- This syncs with your Cloudflare account

### Reset Everything

Use the "Reset configuration" option in the app menu to clean up all settings and start fresh.

## About

Cloudflare Tunnel Buddy makes it easy to expose your local development sites to the internet using Cloudflare's tunnel service. Perfect for:

- **Local Development**: Share Local by Flywheel, XAMPP, MAMP sites instantly
- **Client Previews**: Show work in progress without deployment
- **Testing**: Test webhooks, APIs, and mobile apps against local services
- **Collaboration**: Let team members access your local environment

The app handles all the complex cloudflared configuration automatically while providing a simple, menu-driven interface.

---

_This is a third-party tool and is not affiliated with Cloudflare Inc._
