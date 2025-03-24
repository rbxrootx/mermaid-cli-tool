# MermaidTools

✨ The ultimate Mermaid diagram generator ✨

MermaidTools is a powerful CLI tool for converting Mermaid diagram files to various formats (PNG, SVG, PDF). It provides a rich set of features to customize your diagrams and streamline your workflow.

## Features

- Convert Mermaid diagrams to PNG, SVG, or PDF
- Support for all Mermaid diagram types (flowcharts, sequence diagrams, class diagrams, etc.)
- Interactive mode for quick diagram creation
- Predefined templates for common diagram types
- Customizable themes, sizes, and styling
- Proper newline (\n) handling in diagram text
- Batch processing with recursive directory support
- Configuration file support for consistent settings

## Installation

### Local Installation

```bash
npm install
```

### Global Installation

```bash
npm install -g
```

Or install directly from GitHub:

```bash
npm install -g https://github.com/yourusername/mermaid-cli-tool.git
```

## Usage

### Basic Usage

```bash
mermaidtools diagram.mermaid
```

This will convert `diagram.mermaid` to a PNG file in the current directory.

### Specify Output Format

```bash
mermaidtools diagram.mermaid -f svg
```

### Specify Output Directory

```bash
mermaidtools diagram.mermaid -o ./output
```

### Use a Different Theme

```bash
mermaidtools diagram.mermaid -t dark
```

### Process All Mermaid Files in a Directory

```bash
mermaidtools ./diagrams -r
```

### Interactive Mode

```bash
mermaidtools -i
```

### Create a Diagram from a Template

```bash
mermaidtools template flowchart -o my-flowchart.mermaid
```

## Available Templates

- `flowchart` - Basic flowchart
- `sequence` - Sequence diagram
- `class` - Class diagram
- `er` - Entity Relationship diagram
- `gantt` - Gantt chart
- `git` - Git graph

## Options

```
Options:
  -o, --output <directory>     Output directory (default: current directory)
  -f, --format <format>        Output format (pdf, png, svg) (default: "png")
  -t, --theme <theme>          Mermaid theme (default, forest, dark, neutral) (default: "default")
  -w, --width <width>          Output width in pixels (default: "800")
  -h, --height <height>        Output height in pixels (default: "600")
  -b, --background <color>     Background color (CSS color) (default: "#ffffff")
  -r, --recursive              Process directories recursively (default: false)
  -c, --config <file>          Path to config file (JSON)
  -i, --interactive            Run in interactive mode
  -p, --padding <padding>      Padding around diagram in pixels (default: "20")
  -q, --quality <quality>      Output quality (1-3) (default: "2")
  -s, --scale <scale>          Scale factor for the diagram (default: "1.0")
  -v, --verbose                Show verbose output (default: false)
  --template <template>        Use a predefined template
  -V, --version                output the version number
  -h, --help                   display help for command
```

## Configuration File

You can create a JSON configuration file to store your preferred settings:

```json
{
  "format": "svg",
  "theme": "dark",
  "background": "#1a1a1a",
  "width": "1200",
  "height": "800",
  "quality": "3"
}
```

Then use it with:

```bash
mermaidtools diagram.mermaid -c config.json
```

## Examples

### Create a Flowchart

```bash
# Create a flowchart template
mermaidtools template flowchart -o flowchart.mermaid

# Edit the file with your diagram
nano flowchart.mermaid

# Convert to SVG
mermaidtools flowchart.mermaid -f svg -t forest
```

### Batch Processing

```bash
# Convert all .mermaid files in a directory to PNG
mermaidtools ./diagrams -r -o ./output -f png
```

## License

MIT
