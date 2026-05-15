# Project Conventions & Guidelines for AI Agents

Welcome to the project! When working on this codebase, please adhere to the following rules and conventions established during previous development.

## 1. Static Assets & Images

- **Import Local Images**: When using local images (like background images), always place them in the `src/assets/` directory and `import` them directly into your React components (e.g., `import heroBg from '../assets/background.png';`).
- **Do NOT rely on the `/public` folder for critical UI backgrounds**: We previously encountered caching and network resolution issues when referencing static images via string paths (e.g., `url("/hero-bg.jpg")`). Importing them via Vite's bundler ensures they are correctly hashed and available.

## 2. Service Workers

- **NO Service Workers**: Do **not** implement or register Service Workers (PWA capabilities). The user explicitly requested not to use them because they make debugging difficult. 

## 3. Styling & Animations

- **Tailwind CSS**: Use Tailwind CSS for all styling.
- **Custom Animations**: There is an `animate-slow-pan` utility class defined in `src/index.css` that slowly pans background images. If you add new background images that require panning, reuse this class. **CRITICAL**: Ensure the `animate-slow-pan` class uses `background-size: cover;` rather than explicit percentages (like `150%`). Explicit percentages can cause letterboxing (black areas at the top and bottom) on mobile/portrait aspect ratios.

## 4. Google Maps Integration

- The app uses `@vis.gl/react-google-maps`. Ensure any new map-related features use this library's components (`APIProvider`, `Map`, `AdvancedMarker`, etc.).
- Ensure `GOOGLE_MAPS_PLATFORM_KEY` is loaded correctly via environment variables. Do not hardcode API keys.
