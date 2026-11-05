import { useState, useEffect } from "react";
import { getSoundPreference, setSoundPreference, playPokedexBeep } from "../utils/audio";
import { getFavorites } from "../utils/favorites";

function Navbar() {
  const [soundOn, setSoundOn] = useState(() => getSoundPreference());
  const [favoritesCount, setFavoritesCount] = useState(() => getFavorites().length);

  useEffect(() => {
    function handleFavChange(e) {
      setFavoritesCount((e.detail || getFavorites()).length);
    }

    window.addEventListener("pokedex_favorites_changed", handleFavChange);
    return () => window.removeEventListener("pokedex_favorites_changed", handleFavChange);
  }, []);

  function handleToggleSound() {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundPreference(nextVal);
    if (nextVal) {
      playPokedexBeep();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#82071a] bg-[#DC0A2D] text-white shadow-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        
        {/* Brand / Pokedex Hardware Logo */}
        <a href="/" className="flex items-center gap-3 group">
          {/* Hardware Blue Lens Indicator */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-3 border-white bg-linear-to-br from-[#28AAFD] via-[#0284c7] to-[#014f86] shadow-[0_0_12px_#28AAFD] group-hover:scale-105 transition-transform">
            <div className="absolute top-1.5 left-2 h-2.5 w-2.5 rounded-full bg-white/70 blur-[0.3px]" />
            <div className="h-3 w-3 rounded-full bg-cyan-200/50" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white uppercase font-sans">
                POKÉDEX
              </span>
              <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider text-red-200 border border-white/10">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-100/80">
              National Database
            </p>
          </div>
        </a>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-6 text-xs font-black uppercase tracking-wider md:flex">
          <a
            href="#home"
            className="text-red-100 hover:text-white transition"
          >
            Home
          </a>
          <a
            href="#pokemon"
            className="text-red-100 hover:text-white transition"
          >
            Explorer
          </a>
        </div>

        {/* Action Controls: Sound Toggle & Favorites & Explore */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio FX Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundOn ? "Mute audio" : "Enable audio"}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/25 hover:bg-black/40 text-red-100 hover:text-white transition border border-white/15"
            title={soundOn ? "Sound FX: Enabled (Click to Mute)" : "Sound FX: Muted (Click to Enable)"}
          >
            {soundOn ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </button>

          {/* Favorites Counter Link */}
          <a
            href="#pokemon"
            className="flex items-center gap-1.5 rounded-xl bg-black/25 hover:bg-black/40 px-3 py-2 text-xs font-bold transition border border-white/15 text-red-100 hover:text-white"
            title="Saved Pokémon Favorites"
          >
            <svg className="w-3.5 h-3.5 fill-rose-300" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="font-mono">{favoritesCount}</span>
          </a>

          {/* Explore Button */}
          <a
            href="#pokemon"
            className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#DC0A2D] shadow-md hover:bg-red-50 transition active:scale-95"
          >
            Open Dex
          </a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
