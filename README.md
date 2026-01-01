# Fabric Toolbox UI

A modern dashboard for exploring, configuring, and running Microsoft Fabric tools. Built with React 19, TypeScript, and Tailwind CSS.

![Fabric Toolbox UI](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Vite](https://img.shields.io/badge/Vite-6.4-purple)

## Features

- **Tool Catalog Browser** - Explore 20+ tools organized by category (Monitoring, Accelerators, Samples, Scripts, Tools)
- **Command Palette** - Quick search with `Cmd+K` / `Ctrl+K`
- **Configuration Panel** - Configure tools with required parameters
- **Run Instructions** - Step-by-step guides with copyable commands
- **Download Files** - Generate `.env` files and run scripts
- **Self-Contained** - All tool source files included in `fabric-tools/`
- **Responsive Design** - Collapsible sidebar for different screen sizes
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

1. **Browse** - Select a category and explore available tools
2. **Configure** - Click a tool to open the configuration panel
3. **Set Parameters** - Fill in required configuration values (workspace IDs, connection strings, etc.)
4. **Run** - Follow step-by-step instructions with copyable commands
5. **Download** - Export `.env` files and shell scripts for your environment

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

- [x] Tool catalog with configuration UI
- [x] Download scripts and env files
- [ ] **LLM Integration** - Natural language queries ("migrate my data from Azure to Fabric")
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
