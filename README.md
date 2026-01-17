# Genuary 2026 - GCanvas Showcase

A month-long generative art challenge showcasing the capabilities of the [@guinetik/gcanvas](https://gcanvas.guinetik.com) library.

## About

[Genuary](https://genuary.art) is a month-long generative art challenge where artists create one piece per day following official prompts. This project implements Genuary 2026 prompts as an interactive showcase, demonstrating particle systems, 3D cameras, motion animations, and more.

Each day features an interactive canvas demo with my interpretation of the prompt.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:5171` (or the next available port).

### Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Deploy

Build and deploy to GitHub Pages:

```bash
npm run deploy
```

## Project Structure

```
genuary2026/
├── index.html        # Main showcase page
├── genuary.css       # Terminal aesthetic styling
├── js/
│   ├── main.js       # Bootstrap, scroll handling, lifecycle
│   ├── prompts.js    # Day prompts data
│   └── days/
│       ├── day01.js  # Daily implementations
│       └── ...
├── kernels/          # Experimental studies and unused prompt scripts (archived for future use)
├── docs/             # Implementation documentation
└── public/           # Static assets
```

## Features

- **Scroll-snap navigation** - Smooth scrolling between daily prompts
- **Lazy loading** - Day modules load on-demand for performance
- **Interactive demos** - Mouse-reactive 3D cameras and particle systems
- **Terminal aesthetic** - Green (#0f0) on black with monospace fonts
- **Motion blur trails** - Smooth visual effects

## Technologies

- [@guinetik/gcanvas](https://gcanvas.guinetik.com) - Canvas rendering library
- [Vite](https://vitejs.dev/) - Build tool and dev server
- Vanilla JavaScript (ES modules)

## License

See LICENSE file for details.

## Links

- [Live Site](https://yourusername.github.io/genuary2026/)
- [GCanvas Documentation](https://gcanvas.guinetik.com)
- [Genuary Official Site](https://genuary.art)
