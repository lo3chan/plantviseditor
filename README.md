# PlantVisEditor

A visual 2D diagram canvas and split-view code editor for **PlantUML**.

PlantVisEditor provides real-time bidirectional script synchronization, an interactive visual canvas for manipulating diagram nodes, sequence diagram toolbars, and official PlantUML SVG rendering.

## Features

- **Split-View Editor**: Live PlantUML script editor with real-time diagram preview.
- **Interactive 2D Canvas**: Drag, drop, align, connect, and customize diagram components visually.
- **Sequence Diagram Controls**: Dedicated participant bars, message connectors, and block grouping.
- **Standard Library Support**: Built-in sprites and templates for AWS, Azure, GCP, C4, and Material Design.
- **Official PlantUML Rendering**: Seamless SVG generation with error diagnostics.
- **Export Capabilities**: Export diagrams to PNG, SVG, ASCII, or standard `.puml` source files.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lo3chan/plantviseditor.git
   cd plantviseditor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the local development server with Vite.
- `npm run build`: Bundles the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs TypeScript type checking.

## License

MIT
