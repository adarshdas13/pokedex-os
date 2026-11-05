import { useState } from "react";
import { playPokedexBeep, playPokedexOpen, playPokemonCry } from "../utils/audio";
import { getPokemon } from "../services/pokeapi";

const FEATURED_POKEMON = [
  {
    id: 25,
    name: "Pikachu",
    category: "Mouse Pokémon",
    type: "Electric",
    color: "#F8D030",
    description: "When several of these Pokémon gather, their electricity could build and cause lightning storms.",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    animated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif",
  },
  {
    id: 6,
    name: "Charizard",
    category: "Flame Pokémon",
    type: "Fire / Flying",
    color: "#F08030",
    description: "It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames.",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
    animated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/6.gif",
  },
  {
    id: 94,
    name: "Gengar",
    category: "Shadow Pokémon",
    type: "Ghost / Poison",
    color: "#705898",
    description: "Under a full moon, this Pokémon likes to mimic the shadows of people and laugh at their fright.",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
    animated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/94.gif",
  },
  {
    id: 149,
    name: "Dragonite",
    category: "Dragon Pokémon",
    type: "Dragon / Flying",
    color: "#7038F8",
    description: "It is said to make its home somewhere in the sea. It guides crews of shipwrecks to shore.",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
    animated: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/149.gif",
  },
];

function Hero({ onRandomPokemon, onSelectPokemon }) {
  const [activeFeatured, setActiveFeatured] = useState(FEATURED_POKEMON[0]);
  const [useAnimated, setUseAnimated] = useState(true);
  const [isPlayingCry, setIsPlayingCry] = useState(false);

  async function handleSelectFeatured(starter) {
    playPokedexBeep();
    setActiveFeatured(starter);
  }

  async function handleInspect(starter) {
    playPokedexOpen();
    if (onSelectPokemon) {
      try {
        const full = await getPokemon(starter.id);
        onSelectPokemon(full);
      } catch {
        onSelectPokemon(starter);
      }
    }
  }

  async function handlePlayCry(e) {
    e.stopPropagation();
    if (isPlayingCry) return;
    setIsPlayingCry(true);
    try {
      await playPokemonCry(activeFeatured.id);
    } catch {
      // Ignored
    } finally {
      setIsPlayingCry(false);
    }
  }

  return (
    <section id="home" className="relative overflow-hidden bg-[#f8fafc] border-b border-gray-200">
      {/* Background Matrix / Grid pattern */}
      <div className="absolute inset-0 opacity-25">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-red-400/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* LEFT COLUMN: HERO CONTENT */}
          <div className="lg:col-span-7">
            {/* System Online Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-red-200 bg-red-50/80 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#DC0A2D] shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DC0A2D]" />
              </span>
              <span>Pokédex Operating System v3.8 • 1,025 Entries Loaded</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-gray-950 leading-none">
              Explore The
              <br />
              <span className="text-[#DC0A2D] drop-shadow-sm">Pokédex.</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-gray-600">
              The ultimate high-tech encyclopedia for trainers. Inspect official animated sprites, authentic cries, Dexter voice narration, full base stats, weaknesses, and complete evolution chains.
            </p>

            {/* Interactive Feature Pills */}
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                <span>🔊</span> Official Audio Cries
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                <span>🎙️</span> Dexter Voice Readout
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                <span>🧬</span> Evolution Lineage
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                <span>⚔️</span> Type Matchup Matrix
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-xs">
                <span>✨</span> Shiny Form Viewer
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pokemon"
                className="flex items-center gap-2 rounded-xl bg-[#DC0A2D] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/25 transition hover:bg-[#b50824] active:scale-95"
              >
                <span>Open Pokédex</span>
                <span>↓</span>
              </a>

              {onRandomPokemon && (
                <button
                  onClick={() => {
                    playPokedexOpen();
                    onRandomPokemon();
                  }}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold text-gray-800 shadow-xs transition hover:border-[#DC0A2D] hover:text-[#DC0A2D] active:scale-95"
                >
                  <span>🎲</span>
                  <span>Surprise Pokémon</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: POKEDEX SHOWCASE DEVICE */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Decorative Pokeball backdrop glow */}
              <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-red-500 to-amber-500 opacity-20 blur-xl" />

              <div className="relative rounded-3xl border-4 border-[#99061e] bg-[#DC0A2D] p-5 shadow-2xl text-white">
                {/* Header LED bar */}
                <div className="flex items-center justify-between border-b-2 border-red-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full border-2 border-white bg-linear-to-br from-[#28AAFD] to-[#014f86] shadow-[0_0_10px_#28AAFD]" />
                    <div className="flex gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-red-200 uppercase font-bold tracking-widest">
                    SYSTEM READY
                  </span>
                </div>

                {/* Simulated Screen */}
                <div
                  className="mt-4 rounded-2xl bg-[#1b2228] p-4 border border-zinc-700 shadow-inner cursor-pointer group"
                  onClick={() => handleInspect(activeFeatured)}
                  title="Click to view full Pokédex entry"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400">
                    <span>#{String(activeFeatured.id).padStart(3, "0")} {activeFeatured.name.toUpperCase()}</span>
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] border border-cyan-500/30">
                      {activeFeatured.type}
                    </span>
                  </div>

                  {/* Active Featured Pokemon Image Display */}
                  <div className="relative my-3 flex items-center justify-center h-48 overflow-hidden rounded-xl bg-black/30 border border-white/5">
                    {/* Ambient glow matching type */}
                    <div
                      className="absolute h-32 w-32 rounded-full blur-2xl opacity-40 transition-colors duration-500"
                      style={{ backgroundColor: activeFeatured.color }}
                    />

                    <img
                      src={useAnimated ? activeFeatured.animated : activeFeatured.image}
                      alt={activeFeatured.name}
                      className="relative z-10 max-h-40 max-w-40 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Quick controls on image */}
                    <div className="absolute top-2 right-2 z-20 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playPokedexBeep();
                          setUseAnimated(!useAnimated);
                        }}
                        className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white border border-white/10 uppercase"
                      >
                        {useAnimated ? "2D GIF" : "3D ART"}
                      </button>
                    </div>

                    <button
                      onClick={handlePlayCry}
                      disabled={isPlayingCry}
                      className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded bg-black/70 hover:bg-black px-2 py-1 text-[10px] font-mono text-cyan-300 border border-cyan-500/30"
                      title="Play Cry"
                    >
                      <span>🔊</span>
                      <span>{isPlayingCry ? "Playing..." : "Cry"}</span>
                    </button>
                  </div>

                  {/* Simulated LCD Screen Data */}
                  <div className="rounded-xl bg-black/50 p-2.5 font-mono text-xs text-zinc-300 border border-white/5 space-y-1">
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider font-bold">
                      Species: {activeFeatured.category}
                    </p>
                    <p className="text-[11px] leading-tight text-zinc-300 line-clamp-2">
                      {activeFeatured.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-red-200 group-hover:text-white font-mono font-bold">
                    <span>INSPECT FULL ENTRY</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>

                {/* FEATURED POKEMON ROW (WITH VISIBLE IMAGES) */}
                <div className="mt-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-red-200 font-bold mb-2">
                    FEATURED SPECIMENS:
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {FEATURED_POKEMON.map((starter) => {
                      const isActive = starter.id === activeFeatured.id;
                      return (
                        <button
                          key={starter.id}
                          onClick={() => handleSelectFeatured(starter)}
                          className={`relative flex flex-col items-center rounded-xl p-2 border transition duration-200 ${
                            isActive
                              ? "bg-red-950/80 border-white shadow-[0_0_12px_rgba(255,255,255,0.4)] scale-105"
                              : "bg-red-950/40 border-red-800/40 hover:bg-red-900/60 hover:scale-102"
                          }`}
                          title={`Select ${starter.name}`}
                        >
                          <span className="font-mono text-[9px] text-red-200 font-bold">
                            #{String(starter.id).padStart(3, "0")}
                          </span>

                          {/* Pokemon Image in Featured Tile */}
                          <img
                            src={starter.image}
                            alt={starter.name}
                            className="h-12 w-12 object-contain my-1 drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
                            loading="lazy"
                          />

                          <span className="text-[10px] font-bold text-white uppercase truncate max-w-full">
                            {starter.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
