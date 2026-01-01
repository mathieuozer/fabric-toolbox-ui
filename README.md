# Fabric Toolbox UI

A modern dashboard for exploring and managing Microsoft Fabric tools. Built with React 19, TypeScript, and Tailwind CSS.

![Fabric Toolbox UI](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Vite](https://img.shields.io/badge/Vite-6.4-purple)

## Features

- **Tool Catalog Browser** - Explore 40+ tools organized by category (Monitoring, Accelerators, Samples, Scripts, Tools)
- **Command Palette** - Quick search with `Cmd+K` / `Ctrl+K`
- **Detail Panels** - Slide-in panels with tool information and GitHub links
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

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.4
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Routing**: React Router 7
- **Testing**: Vitest + Testing Library

## Project Structure

```
src/
├── components/
│   ├── layout/      # Shell, Sidebar, TopBar
│   ├── pages/       # Page components
│   └── ui/          # shadcn/ui components
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── modules/         # Feature modules
├── services/        # API services
└── types/           # TypeScript types
```

## Roadmap

- [ ] LLM Integration - Natural language queries ("migrate my data from Azure to Fabric")
- [ ] Azure AD Authentication
- [ ] Tool configuration wizard
- [ ] Direct tool execution from dashboard

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with the [Microsoft Fabric Toolbox](https://github.com/microsoft/fabric-toolbox)
