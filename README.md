# 🔴 Pokédex Pro

An authentic, retro-modern handheld Pokédex web encyclopedia powered by the [PokeAPI](https://pokeapi.co/), built with **React 19**, **Vite**, and **Tailwind CSS v4**.

Experience the National Pokédex like a real Pokémon trainer with interactive device hardware styling, official animated sprites, real Pokémon audio cries, Dexter text-to-speech voice narration, complete base stat breakdowns, type battle matchups, and evolutionary trees across all 9 generations (1,025+ Pokémon).

---

## ✨ Features

### 🎮 Authentic Handheld Pokédex Device
- **Hardware Console**: Crimson red chassis (`#DC0A2D`), specular metallic bevels, flashing LED status diodes, and the iconic glowing blue scanner lens.
- **2D Animated GIF vs. 3D Official Artwork**: Instant toggle between Pokémon Showdown animated battle sprites and high-res official artwork.
- **Shiny Form Switcher (✨)**: One-click toggle between standard and shiny Pokémon forms.
- **Official Pokémon Audio Cries (🔊)**: Crystal-clear sound playback directly from the official Pokémon sound archive.
- **Dexter Voice Narration (🎙️)**: Built-in Speech Synthesis assistant that reads the Pokédex description aloud anime-style.
- **Hardware Keyboard Navigation**: Cycle adjacent entries with the `←` / `→` arrow keys or press `ESC` to close.

### 📊 Deep Tactical & Biological Data
- **Official Pokédex Entries**: Clean, authoritative lore descriptions without clutter or duplicate version noise.
- **Animated Base Stats (BST)**: Color-coded progress bars for HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed, with total stat score and tier ratings (Standard, Advanced, Legendary).
- **Type Matchup Matrix**: Live battle effectiveness calculations showing 2×/4× weaknesses, 0.5×/0.25× resistances, and 0× immunities.
- **Interactive Evolution Chains**: Visual evolution timeline displaying required triggers (level-up, evolution stones, trading) with clickable sprites to jump straight to any evolutionary stage.
- **Physical & Training Specs**: Height, weight, gender distribution ratios (♂ / ♀ / Genderless), abilities with Hidden Ability badges, catch rates, base happiness, base EXP, and egg groups.

### 🔍 Advanced Search, Filtering & Organization
- **Instant Search**: Real-time typeahead search by Pokémon name or National Dex number (e.g., `Pikachu` or `025`).
- **Generation & Region Selector**: Switch between Kanto (Gen I), Johto (Gen II), Hoenn (Gen III), Sinnoh (Gen IV), Unova (Gen V), Kalos (Gen VI), Alola (Gen VII), Galar (Gen VIII), Paldea (Gen IX), or All Generations.
- **Pre-Paginated Elemental Type Filter**: Filter across all 18 types with accurate pagination and zero empty page drops.
- **Favorites & Team Builder (❤️)**: Save and manage your dream team in `localStorage` with real-time counter updates.
- **Multi-criteria Sorting**: Sort by Pokédex number (Ascending / Descending) or name (A–Z / Z–A).
- **Surprise Me (🎲)**: Random Pokémon generator to discover new specimens.

### 🔊 Audio Engine
- **Web Audio API Synthesizer**: Zero-dependency 8-bit retro sound effects for UI chirps, boot-up chimes, and close tones.
- **Mute / Unmute Control**: Toggle sound effects at any time via the navigation bar.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) with `@vitejs/plugin-react`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **API**: [PokeAPI v2](https://pokeapi.co/) with in-memory request caching
- **Audio & Speech**: Web Audio API & Web Speech API (`SpeechSynthesis`)
- **Linting**: ESLint 10

---

## 📁 Project Structure

```text
pokedex/
├── public/
│   ├── favicon.svg          # Custom scalable Pokéball vector favicon
│   └── icons.svg
├── src/
│   ├── assets/              # Static assets & hero artwork
│   ├── components/
│   │   ├── Hero.jsx         # Interactive console showcase with featured specimens
│   │   ├── NavBar.jsx       # Header with sound toggle & favorites counter
│   │   ├── PokedexModal.jsx # Full-screen handheld Pokédex device inspector
│   │   ├── PokemonCard.jsx  # Grid cards with quick stats, hover sprites & badges
│   │   └── PokemonGrid.jsx  # Search, filter, sorting, and pagination engine
│   ├── services/
│   │   └── pokeapi.js       # PokeAPI client with caching & type-indexing
│   ├── utils/
│   │   ├── audio.js         # Web Audio API sound FX & Speech Synthesis helper
│   │   ├── favorites.js     # Persistent localStorage favorites manager
│   │   └── typeChart.js     # 18-type effectiveness chart & color definitions
│   ├── App.css              # Custom scanline animations & scrollbars
│   ├── App.jsx              # Main application orchestrator
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/) installed.

### Installation

1. Clone the repository or navigate to the workspace:
   ```bash
   cd pokedex
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles and bundles production assets into `dist/`. |
| `npm run preview` | Runs a local preview of the production build. |
| `npm run lint` | Runs ESLint across all codebase files to check for issues. |

---

## 📄 License & Credits

- Pokémon content, character names, and sprites are trademarks and copyrights of **Nintendo**, **Game Freak**, and **The Pokémon Company**.
- Pokémon data and assets provided by the [PokeAPI](https://pokeapi.co/) project.
- Animated battle sprites provided by Pokémon Showdown.
