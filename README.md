# Fabric Toolbox UI

A modern dashboard for exploring, configuring, and running Microsoft Fabric tools. Built with React 19, TypeScript, and Tailwind CSS.

![Fabric Toolbox UI](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Vite](https://img.shields.io/badge/Vite-6.4-purple)

## Features

- **40+ Tool Catalog** - Explore tools organized by category (Monitoring, Accelerators, Samples, Scripts, Tools)
- **AI Tool Finder** - Natural language search with auto-configuration extraction
- **Command Palette** - Quick search with `Cmd+K` / `Ctrl+K`
- **Configuration Panel** - Configure tools with required parameters
- **Deploy Packages** - Generate ZIP files with scripts, .env, and README
- **Git Integration** - Push configurations directly to your repository
- **Self-Contained** - All tool source files included in `fabric-tools/`
- **Modern UI** - Ocean Blue color palette with Plus Jakarta Sans typography

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:mathieuozer/fabric-toolbox-ui.git
cd fabric-toolbox-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## How It Works

### Quick Start Flow

1. **Browse** - Select a category and explore available tools
2. **Configure** - Click a tool to open the configuration panel
3. **Set Parameters** - Fill in required configuration values
4. **Deploy** - Download ZIP package with scripts and configs
5. **Run** - Execute `./run.sh` (Linux/macOS) or `run.bat` (Windows)

---

## AI Tool Finder

Click the **"Ask AI"** button to use natural language to find tools and auto-configure them.

### Basic Usage

Just describe what you want to do:
- "migrate from Azure Data Factory"
- "monitor my Fabric costs"
- "improve DAX performance"

### Auto-Configuration (Pro Tip!)

Include IDs and names in your query to **automatically pre-fill** the configuration form:

| Query Example | Auto-Extracted Values |
|--------------|----------------------|
| `migrate from ADF my-factory in resource group rg-prod to workspace 12345678-1234-1234-1234-123456789abc` | adfName: my-factory, adfResourceGroup: rg-prod, targetWorkspaceId: 12345678-... |
| `monitor costs for capacity 87654321-4321-4321-4321-abcdef123456` | capacityId: 87654321-... |
| `copy warehouse from server myserver.database.fabric.microsoft.com database sales_db` | serverName: myserver..., databaseName: sales_db |

### Supported Auto-Config Patterns

| Pattern | Example | Extracted Field |
|---------|---------|----------------|
| Workspace ID (GUID) | `to workspace abc12345-...` | workspaceId |
| Resource Group | `resource group rg-production` | adfResourceGroup |
| ADF/Factory Name | `from ADF my-factory` | adfName |
| Capacity ID | `capacity 12345678-...` | capacityId |
| Server Name | `server myserver.database.fabric.microsoft.com` | serverName |
| Database Name | `database sales_db` | databaseName |
| Storage Account | `storage mystorageaccount` | storageAccount |

---

## Deploy Packages

The Deploy tab generates a complete package:

| File | Description |
|------|-------------|
| `.env` | Environment variables with your config values |
| `run.sh` | Linux/macOS shell script with all commands |
| `run.bat` | Windows batch script |
| `README.md` | Full documentation with prerequisites |
| `git-push.sh` | (Optional) Script to push to your Git repo |

### Using the Package

```bash
# 1. Unzip the downloaded package
unzip adf-migrate-deployment.zip
cd adf-migrate-deployment

# 2. Edit .env if needed
nano .env

# 3. Run (Linux/macOS)
chmod +x run.sh
./run.sh

# 3. Run (Windows)
run.bat
```

---

## Git Integration

To push configurations to your repository:

1. Go to the **Deploy** tab
2. Enter your **Repository URL** (e.g., `https://github.com/user/repo.git`)
3. Set the **Branch** (default: `main`)
4. Download the ZIP - it includes `git-push.sh`
5. Run `./git-push.sh` to commit and push

## Tool Categories

| Category | Description | Example Tools |
|----------|-------------|---------------|
| **Monitoring** | Dashboards and reports for Fabric observability | Cost Analysis, Admin Monitoring, Spark Monitoring |
| **Accelerators** | Patterns and templates for common scenarios | BCDR, CI/CD Pipelines, Policy Weaver |
| **Samples** | Code samples and notebooks | Open Mirroring, Workspace Size Calculator |
| **Scripts** | SQL and utility scripts | Mirror CCI Tables, Kill Queries SP |
| **Tools** | Standalone applications and SDKs | ADF Migration Assistant, MCP Servers |

## Design System

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Ocean Blue | `#2B8EC3` | Primary accent, buttons, links |
| Sky Reflection | `#79B8D9` | Hover states, secondary accents |
| Icy Blue | `#AAD1E7` | Subtle highlights, borders |
| White | `#FFFFFF` | Primary text |
| Off White | `#FEFEFE` | Body text |

### Typography

- **Headings**: Plus Jakarta Sans (600-700 weight)
- **Body**: Inter (400-500 weight)

## Project Structure

```
├── fabric-tools/           # All tool source files
│   ├── accelerators/       # BCDR, CI/CD patterns
│   ├── monitoring/         # PowerBI reports, dashboards
│   ├── samples/            # Notebooks, code samples
│   ├── scripts/            # T-SQL scripts
│   └── tools/              # Applications, SDKs
├── src/
│   ├── data/
│   │   └── toolsManifest.ts  # Tool configurations & metadata
│   ├── components/
│   │   ├── layout/         # Shell, Sidebar, TopBar
│   │   ├── pages/          # Page components
│   │   └── ui/             # shadcn/ui components
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
└── public/                 # Static assets
```

## Roadmap

- [x] Tool catalog with 40+ tools
- [x] Download scripts and env files
- [x] **AI Tool Finder** - Natural language queries with auto-config extraction
- [x] **Deploy Packages** - ZIP generation with .env, scripts, README
- [x] **Git Integration** - Push configs to repositories
- [ ] Azure AD Authentication
- [ ] Direct tool execution from dashboard
- [ ] Tool execution status tracking

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.4
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Testing**: Vitest + Testing Library

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Based on [Microsoft Fabric Toolbox](https://github.com/microsoft/fabric-toolbox)
