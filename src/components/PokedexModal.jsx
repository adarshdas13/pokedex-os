import { useEffect, useState, useCallback } from "react";
import {
  getPokemon,
  getPokemonSpecies,
  getEvolutionChain,
} from "../services/pokeapi";
import { TYPE_COLORS, getTypeMatchups } from "../utils/typeChart";
import {
  playPokedexBeep,
  playPokedexClose,
  playPokemonCry,
  stopPokemonCry,
  speakDexEntry,
  stopSpeaking,
} from "../utils/audio";
import { isFavorite, toggleFavorite } from "../utils/favorites";

const STAT_CONFIG = [
  { key: "hp", label: "HP", color: "bg-emerald-500", max: 255 },
  { key: "attack", label: "ATK", color: "bg-orange-500", max: 255 },
  { key: "defense", label: "DEF", color: "bg-amber-500", max: 255 },
  { key: "special-attack", label: "SP.ATK", color: "bg-sky-500", max: 255 },
  { key: "special-defense", label: "SP.DEF", color: "bg-indigo-500", max: 255 },
  { key: "speed", label: "SPD", color: "bg-rose-500", max: 255 },
];

export default function PokedexModal({
  pokemon: initialPokemon,
  onClose,
  onNavigate,
}) {
  const [pokemon, setPokemon] = useState(initialPokemon);
  const [species, setSpecies] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about"); // 'about' | 'stats' | 'evolution' | 'matchups'
  const [isShiny, setIsShiny] = useState(false);
  const [useAnimatedSprite, setUseAnimatedSprite] = useState(true);
  const [isPlayingCry, setIsPlayingCry] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [favStatus, setFavStatus] = useState(() => isFavorite(initialPokemon?.id));

  const pokemonId = pokemon?.id;

  // Handle switching to a specific Pokemon (e.g. from evolution chain or arrows)
  const handleNavigatePokemon = useCallback(async (id) => {
    if (!id || id < 1 || id > 1025) return;
    playPokedexBeep();
    stopSpeaking();
    stopPokemonCry();
    setIsSpeaking(false);
    setIsPlayingCry(false);

    try {
      const nextPoke = await getPokemon(id);
      setPokemon(nextPoke);
      setFavStatus(isFavorite(nextPoke.id));
      setIsShiny(false);
      if (onNavigate) onNavigate(nextPoke);
    } catch (err) {
      console.error("Failed to navigate to pokemon", err);
    }
  }, [onNavigate]);

  // Load detailed species & evolution info
  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (!pokemonId) return;
      setLoading(true);

      try {
        // If we only have partial pokemon info, fetch full
        if (!pokemon.stats || !pokemon.sprites) {
          const fullPokemon = await getPokemon(pokemonId);
          if (!cancelled) setPokemon(fullPokemon);
        }

        const speciesData = await getPokemonSpecies(pokemonId);
        if (cancelled) return;

        setSpecies(speciesData);

        if (speciesData?.evolutionChainUrl) {
          const chain = await getEvolutionChain(speciesData.evolutionChainUrl);
          if (!cancelled) setEvolutionChain(chain);
        } else {
          setEvolutionChain([]);
        }
      } catch (err) {
        console.error("Error loading pokemon details:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
      stopSpeaking();
      stopPokemonCry();
    };
  }, [pokemonId, pokemon.stats, pokemon.sprites]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        playPokedexClose();
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (pokemonId > 1) {
          handleNavigatePokemon(pokemonId - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (pokemonId < 1025) {
          handleNavigatePokemon(pokemonId + 1);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pokemonId, onClose, handleNavigatePokemon]);

  function handleToggleFav() {
    playPokedexBeep();
    const newStatus = toggleFavorite(pokemon.id);
    setFavStatus(newStatus);
  }

  async function handlePlayCry() {
    if (isPlayingCry) return;
    setIsPlayingCry(true);
    try {
      await playPokemonCry(pokemon.id, pokemon.cries?.latest);
    } catch {
      // Ignored
    } finally {
      setIsPlayingCry(false);
    }
  }

  function handleToggleSpeech() {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const description = species?.description || `${pokemon.name}, a ${species?.englishGenus || "Pokémon"}.`;
    const speechText = `${pokemon.name}. The ${species?.englishGenus || "Pokémon"}. ${description}`;

    playPokedexBeep();
    const started = speakDexEntry(
      speechText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
    if (!started) setIsSpeaking(false);
  }

  if (!pokemon) return null;

  const primaryType = pokemon.types?.[0]?.type?.name || "normal";
  const primaryTypeData = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
  const defenderTypes = pokemon.types?.map((t) => t.type.name) || [];
  const typeMatchups = getTypeMatchups(defenderTypes);

  // Compute stat sum
  const totalStats = (pokemon.stats || []).reduce(
    (acc, curr) => acc + curr.base_stat,
    0
  );

  // Determine sprite
  const officialArtwork =
    (isShiny
      ? pokemon.sprites?.other?.["official-artwork"]?.front_shiny
      : pokemon.sprites?.other?.["official-artwork"]?.front_default) ||
    pokemon.sprites?.front_default;

  const showdownSprite =
    (isShiny
      ? pokemon.sprites?.other?.showdown?.front_shiny
      : pokemon.sprites?.other?.showdown?.front_default) || officialArtwork;

  const displaySprite = useAnimatedSprite ? showdownSprite : officialArtwork;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md bg-black/75 animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playPokedexClose();
          onClose();
        }
      }}
    >
      {/* Pokédex Hardware Device Container */}
      <div className="relative w-full max-w-5xl my-auto rounded-3xl bg-[#DC0A2D] p-3 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(220,10,45,0.35)] border-4 border-[#99061e] text-white overflow-hidden">
        
        {/* Hardware Metallic Bevel & Top Screws */}
        <div className="absolute top-2 left-6 h-2 w-2 rounded-full bg-stone-300 shadow-inner" />
        <div className="absolute top-2 right-6 h-2 w-2 rounded-full bg-stone-300 shadow-inner" />
        <div className="absolute bottom-2 left-6 h-2 w-2 rounded-full bg-stone-300 shadow-inner" />
        <div className="absolute bottom-2 right-6 h-2 w-2 rounded-full bg-stone-300 shadow-inner" />

        {/* TOP SENSOR BAR & STATUS HUD */}
        <header className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#99061e] pb-3">
          {/* Iconic Big Blue Camera / Sensor Lens */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-4 border-white bg-linear-to-br from-[#28AAFD] via-[#0284c7] to-[#034077] shadow-[0_0_20px_#28AAFD,inset_0_2px_4px_rgba(255,255,255,0.7)]">
              {/* Glass Glint */}
              <div className="absolute top-2 left-2.5 h-3.5 w-3.5 rounded-full bg-white/70 blur-[0.5px]" />
              <div className="h-4 w-4 rounded-full bg-cyan-200/40 animate-ping opacity-75" />
            </div>

            {/* 3 Status Indicator LEDs */}
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full bg-[#ff3333] border border-black/40 shadow-[0_0_8px_#ff3333] animate-pulse"
                title="Power Status"
              />
              <span
                className="h-3.5 w-3.5 rounded-full bg-[#ffcc00] border border-black/40 shadow-[0_0_8px_#ffcc00]"
                title="Scanner Status"
              />
              <span
                className="h-3.5 w-3.5 rounded-full bg-[#00e676] border border-black/40 shadow-[0_0_8px_#00e676]"
                title="Database Link"
              />
            </div>
          </div>

          {/* Model Display & Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-2 font-mono text-[10px] tracking-widest text-red-200 uppercase">
              <span>PKDX-PRO • v3.8</span>
              <span className="text-emerald-300 font-bold">LINK ESTABLISHED</span>
            </div>

            {/* Favorite / Team Button */}
            <button
              onClick={handleToggleFav}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                favStatus
                  ? "bg-rose-500 text-white shadow-rose-900/50"
                  : "bg-[#7f0619] hover:bg-[#99061e] text-red-100"
              }`}
              title={favStatus ? "Remove from Favorites" : "Add to Favorites / Dream Team"}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="hidden sm:inline">{favStatus ? "Saved" : "Favorite"}</span>
            </button>

            {/* Close Device Button */}
            <button
              onClick={() => {
                playPokedexClose();
                onClose();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7f0619] hover:bg-[#5c0311] text-white transition shadow-inner font-mono font-bold text-lg"
              title="Close Pokédex (ESC)"
            >
              ✕
            </button>
          </div>
        </header>

        {/* MAIN CONSOLE: DUAL SCREENS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* ================= LEFT CONSOLE: VISUAL DISPLAY ================= */}
          <section aria-label="Visual Display" className="lg:col-span-5 flex flex-col rounded-2xl bg-[#26262a] p-3 sm:p-4 border-2 border-[#1c1c1e] shadow-2xl">
            {/* Screen Bezel Header Lights */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="ml-2 font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                  VISUAL DISPLAY // #{String(pokemon.id).padStart(3, "0")}
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">24-BIT RGB</span>
            </div>

            {/* Main Holographic Screen with Scanlines */}
            <div
              className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden p-4 min-h-70 sm:min-h-80 border border-cyan-500/20 shadow-inner transition-all duration-300"
              style={{
                background: `radial-gradient(circle at center, ${primaryTypeData.bg}35 0%, #0e151c 70%, #060a0e 100%)`,
              }}
            >
              {/* Scanline CRT overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 2px, transparent 4px)",
                }}
              />

              {/* Watermark Pokeball */}
              <div className="pointer-events-none absolute right-[-20%] bottom-[-20%] w-64 h-64 rounded-full border-8 border-white/5" />

              {/* Top Screen Chips (Species and Shiny Status) */}
              <div className="relative z-10 w-full flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-black/60 text-cyan-400 border border-cyan-500/30">
                  #{String(pokemon.id).padStart(3, "0")}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Shiny Toggle */}
                  <button
                    onClick={() => {
                      playPokedexBeep();
                      setIsShiny(!isShiny);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition ${
                      isShiny
                        ? "bg-amber-400 text-stone-900 shadow-[0_0_10px_#facc15]"
                        : "bg-black/60 text-zinc-300 hover:text-white border border-white/10"
                    }`}
                    title="Toggle Shiny Sprite"
                  >
                    <span>✨</span>
                    <span>{isShiny ? "Shiny" : "Normal"}</span>
                  </button>

                  {/* 2D Animated vs 3D Official Artwork Toggle */}
                  <button
                    onClick={() => {
                      playPokedexBeep();
                      setUseAnimatedSprite(!useAnimatedSprite);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition ${
                      useAnimatedSprite
                        ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/40"
                        : "bg-black/60 text-zinc-400 border border-white/10"
                    }`}
                    title="Toggle Animated GIF / Official Artwork"
                  >
                    {useAnimatedSprite ? "2D GIF" : "3D ART"}
                  </button>
                </div>
              </div>

              {/* Pokemon Sprite Display */}
              <div className="relative z-10 my-auto flex items-center justify-center p-2 group">
                <img
                  src={displaySprite}
                  alt={pokemon.name}
                  className="max-h-48 sm:max-h-56 max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Screen Bottom Controls: Cry & Dexter Speech */}
              <div className="relative z-10 w-full flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10">
                {/* Cry Player Button */}
                <button
                  onClick={handlePlayCry}
                  disabled={isPlayingCry}
                  className="flex items-center gap-2 rounded-lg bg-black/60 hover:bg-black/80 px-3 py-1.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30 transition disabled:opacity-50"
                  title="Play Authentic Pokemon Cry"
                >
                  <svg className={`w-3.5 h-3.5 ${isPlayingCry ? "animate-bounce text-cyan-400" : ""}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                  <span>{isPlayingCry ? "CRYING..." : "PLAY CRY"}</span>
                </button>

                {/* Dexter Voice Assistant Readout */}
                <button
                  onClick={handleToggleSpeech}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition border ${
                    isSpeaking
                      ? "bg-rose-500 text-white border-rose-400 animate-pulse"
                      : "bg-black/60 hover:bg-black/80 text-emerald-300 border-emerald-500/30"
                  }`}
                  title="Have Dexter read the Pokedex entry aloud"
                >
                  <span className="text-sm">{isSpeaking ? "⏹" : "🎙"}</span>
                  <span>{isSpeaking ? "STOP" : "DEX VOICE"}</span>
                </button>
              </div>
            </div>

            {/* Sub-Screen Physical Data Bars */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#1a1a1c] p-2.5 border border-zinc-800">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">HEIGHT</span>
                <span className="font-mono text-sm font-bold text-white">
                  {(pokemon.height / 10).toFixed(1)} m{" "}
                  <span className="text-[11px] font-normal text-zinc-400">
                    ({Math.floor((pokemon.height * 3.937) / 12)}&apos;{Math.round((pokemon.height * 3.937) % 12)}&quot;)
                  </span>
                </span>
              </div>

              <div className="rounded-lg bg-[#1a1a1c] p-2.5 border border-zinc-800">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">WEIGHT</span>
                <span className="font-mono text-sm font-bold text-white">
                  {(pokemon.weight / 10).toFixed(1)} kg{" "}
                  <span className="text-[11px] font-normal text-zinc-400">
                    ({((pokemon.weight / 10) * 2.20462).toFixed(1)} lbs)
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Identification */}
            <div className="mt-2 rounded-lg bg-[#1a1a1c] p-2.5 border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  {pokemon.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  {species?.englishGenus || "Pokémon"}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {pokemon.types?.map((item) => {
                  const tName = item.type.name;
                  const tColor = TYPE_COLORS[tName] || TYPE_COLORS.normal;
                  return (
                    <span
                      key={tName}
                      className="rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm"
                      style={{
                        backgroundColor: tColor.bg,
                        color: tColor.text,
                      }}
                    >
                      {tName}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================= RIGHT CONSOLE: TACTICAL DATA TERMINAL ================= */}
          <section aria-label="Tactical Data" className="lg:col-span-7 flex flex-col rounded-2xl bg-[#1e2024] p-3 sm:p-5 border-2 border-[#121315] shadow-2xl">
            {/* Screen Header Tabs */}
            <nav aria-label="Pokédex entry sections" className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-zinc-700/60 scrollbar-none">
              {[
                { id: "about", label: "Entry & Lore", icon: "📖" },
                { id: "stats", label: "Base Stats", icon: "📊" },
                { id: "evolution", label: "Evolution Line", icon: "🧬" },
                { id: "matchups", label: "Type Matchups", icon: "⚔️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    playPokedexBeep();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shrink-0 ${
                    activeTab === tab.id
                      ? "bg-[#DC0A2D] text-white shadow-md shadow-red-950/60"
                      : "bg-[#292c33] text-zinc-400 hover:text-white hover:bg-[#343842]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* TAB CONTENTS */}
            <div className="flex-1 py-4 overflow-y-auto max-h-95 sm:max-h-110 pr-1">
              
              {/* ------------ TAB 1: ABOUT & LORE ------------ */}
              {activeTab === "about" && (
                <div className="space-y-4">
                  {/* Single Clean Pokédex Flavor Text Screen */}
                  <div className="rounded-xl bg-[#0f1418] p-4 border border-zinc-800 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                        POKÉDEX DATA ENTRY
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                        OFFICIAL RECORD
                      </span>
                    </div>

                    <p className="font-mono text-sm leading-relaxed text-zinc-200">
                      &quot;{species?.description || "Scanning Pokédex database for regional lore..."}&quot;
                    </p>
                  </div>

                  {/* Biological & Training Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        CATEGORY
                      </span>
                      <span className="text-sm font-bold text-white capitalize">
                        {species?.englishGenus || "Seed"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        CATCH RATE
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {species?.captureRate !== undefined ? `${species.captureRate} / 255` : "—"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        BASE HAPPINESS
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {species?.baseHappiness !== undefined ? `${species.baseHappiness}` : "70"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        BASE EXP
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        {pokemon.base_experience || "—"} XP
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        EGG GROUPS
                      </span>
                      <span className="text-xs font-bold text-white capitalize">
                        {species?.eggGroups?.join(", ") || "Undiscovered"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#272b33] p-3 border border-zinc-800">
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        GENDER RATIO
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {species?.genderRate === -1
                          ? "Genderless"
                          : `${((8 - species?.genderRate) / 8) * 100}% ♂ / ${(species?.genderRate / 8) * 100}% ♀`}
                      </span>
                    </div>
                  </div>

                  {/* Abilities */}
                  <div className="rounded-xl bg-[#272b33] p-3.5 border border-zinc-800">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block mb-2">
                      ABILITIES
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pokemon.abilities?.map((ab) => (
                        <div
                          key={ab.ability.name}
                          className="flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 border border-zinc-700/60"
                        >
                          <span className="text-xs font-bold text-white capitalize">
                            {ab.ability.name.replace(/-/g, " ")}
                          </span>
                          {ab.is_hidden && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-rose-300 uppercase">
                              Hidden
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------ TAB 2: BASE STATS ------------ */}
              {activeTab === "stats" && (
                <div className="space-y-4">
                  {/* Total Stat Badge & Tier */}
                  <div className="flex items-center justify-between rounded-xl bg-[#0f1418] p-3.5 border border-zinc-800">
                    <div>
                      <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
                        BASE STAT TOTAL (BST)
                      </span>
                      <span className="text-2xl font-black font-mono text-white">
                        {totalStats}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      totalStats >= 600
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : totalStats >= 500
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    }`}>
                      {totalStats >= 600 ? "Legendary / Top Tier" : totalStats >= 500 ? "Advanced Tier" : "Standard Tier"}
                    </span>
                  </div>

                  {/* Stat Progress Bars */}
                  <div className="space-y-3 rounded-xl bg-[#272b33] p-4 border border-zinc-800">
                    {STAT_CONFIG.map((statItem) => {
                      const statObj = pokemon.stats?.find(
                        (s) => s.stat.name === statItem.key
                      );
                      const value = statObj ? statObj.base_stat : 0;
                      const percentage = Math.min(100, Math.round((value / statItem.max) * 100));

                      return (
                        <div key={statItem.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-zinc-400 w-16">
                              {statItem.label}
                            </span>
                            <span className="font-mono font-bold text-white text-sm">
                              {value}
                            </span>
                          </div>

                          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
                            <div
                              className={`h-full ${statItem.color} transition-all duration-700 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------ TAB 3: EVOLUTION LINE ------------ */}
              {activeTab === "evolution" && (
                <div className="space-y-4">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block">
                    EVOLUTION STAGES // CLICK ANY FORM TO INSPECT
                  </span>

                  {loading ? (
                    <div className="py-12 text-center text-sm text-zinc-400 font-mono animate-pulse">
                      Tracing evolutionary timeline...
                    </div>
                  ) : evolutionChain.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-4 py-4">
                      {evolutionChain.map((evo, idx) => {
                        const isCurrent = evo.id === pokemon.id;
                        return (
                          <div key={evo.id} className="flex items-center gap-3">
                            {/* Evolution Trigger Arrow */}
                            {idx > 0 && (
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-[10px] text-amber-400 font-bold bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-700">
                                  {evo.trigger || "Level Up"}
                                </span>
                                <span className="text-zinc-500 font-bold text-sm">→</span>
                              </div>
                            )}

                            {/* Evolution Card */}
                            <button
                              onClick={() => handleNavigatePokemon(evo.id)}
                              className={`group relative flex flex-col items-center p-3 rounded-xl border-2 transition duration-200 ${
                                isCurrent
                                  ? "bg-[#DC0A2D]/20 border-[#DC0A2D] shadow-[0_0_15px_rgba(220,10,45,0.4)]"
                                  : "bg-[#272b33] border-zinc-700 hover:border-zinc-500 hover:scale-105"
                              }`}
                            >
                              <span className="font-mono text-[10px] text-zinc-400 font-bold">
                                #{String(evo.id).padStart(3, "0")}
                              </span>

                              <img
                                src={evo.sprite}
                                alt={evo.name}
                                className="h-20 w-20 object-contain my-1 group-hover:scale-110 transition duration-300"
                              />

                              <span className="text-xs font-black uppercase text-white tracking-tight">
                                {evo.name}
                              </span>

                              {isCurrent && (
                                <span className="mt-1 text-[9px] font-mono uppercase font-bold text-red-400">
                                  Current Form
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#272b33] p-8 text-center text-zinc-400">
                      <p className="font-bold text-white text-base">This Pokémon does not evolve.</p>
                      <p className="text-xs mt-1">Single stage evolutionary form.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ------------ TAB 4: TYPE MATCHUPS ------------ */}
              {activeTab === "matchups" && (
                <div className="space-y-4">
                  {/* Weaknesses */}
                  <div className="rounded-xl bg-[#272b33] p-3.5 border border-zinc-800">
                    <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">
                      ⚠️ WEAK AGAINST (Takes Increased Damage)
                    </span>
                    {typeMatchups.weaknesses.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {typeMatchups.weaknesses.map((item) => {
                          const tColor = TYPE_COLORS[item.type] || TYPE_COLORS.normal;
                          return (
                            <div
                              key={item.type}
                              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border border-black/30"
                              style={{ backgroundColor: `${tColor.bg}25` }}
                            >
                              <span
                                className="text-xs font-black uppercase"
                                style={{ color: tColor.bg }}
                              >
                                {item.type}
                              </span>
                              <span className="rounded bg-rose-600/80 px-1.5 py-0.5 font-mono text-[11px] font-black text-white">
                                {item.multiplier}×
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No weaknesses detected!</p>
                    )}
                  </div>

                  {/* Resistances */}
                  <div className="rounded-xl bg-[#272b33] p-3.5 border border-zinc-800">
                    <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                      🛡️ RESISTANT TO (Takes Reduced Damage)
                    </span>
                    {typeMatchups.resistances.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {typeMatchups.resistances.map((item) => {
                          const tColor = TYPE_COLORS[item.type] || TYPE_COLORS.normal;
                          return (
                            <div
                              key={item.type}
                              className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border border-black/30"
                              style={{ backgroundColor: `${tColor.bg}25` }}
                            >
                              <span
                                className="text-xs font-black uppercase"
                                style={{ color: tColor.bg }}
                              >
                                {item.type}
                              </span>
                              <span className="rounded bg-emerald-600/80 px-1.5 py-0.5 font-mono text-[11px] font-black text-white">
                                {item.multiplier}×
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">No resistances.</p>
                    )}
                  </div>

                  {/* Immunities */}
                  {typeMatchups.immunities.length > 0 && (
                    <div className="rounded-xl bg-[#272b33] p-3.5 border border-zinc-800">
                      <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider block mb-2">
                        ⭐ IMMUNE TO (Takes 0 Damage)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {typeMatchups.immunities.map((type) => {
                          const tColor = TYPE_COLORS[type] || TYPE_COLORS.normal;
                          return (
                            <div
                              key={type}
                              className="flex items-center gap-2 rounded-lg px-3 py-1.5 border border-black/30"
                              style={{ backgroundColor: `${tColor.bg}30` }}
                            >
                              <span
                                className="text-xs font-black uppercase"
                                style={{ color: tColor.bg }}
                              >
                                {type}
                              </span>
                              <span className="rounded bg-sky-600 px-1.5 py-0.5 font-mono text-[10px] font-black text-white">
                                0× (IMMUNE)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* HARDWARE FOOTER: PREV / NEXT POKEMON NAVIGATION */}
            <div className="mt-auto pt-3 border-t border-zinc-700/60 flex items-center justify-between gap-2">
              <button
                onClick={() => handleNavigatePokemon(pokemon.id - 1)}
                disabled={pokemon.id <= 1}
                className="flex items-center gap-2 rounded-xl bg-[#2a2d34] hover:bg-[#343842] disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-mono font-bold text-white transition border border-zinc-700"
              >
                <span>←</span>
                <span>#{String(Math.max(1, pokemon.id - 1)).padStart(3, "0")} PREV</span>
              </button>

              <span className="font-mono text-[11px] text-zinc-500 hidden sm:inline">
                USE ARROW KEYS ← / → TO CYCLE
              </span>

              <button
                onClick={() => handleNavigatePokemon(pokemon.id + 1)}
                disabled={pokemon.id >= 1025}
                className="flex items-center gap-2 rounded-xl bg-[#2a2d34] hover:bg-[#343842] disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-mono font-bold text-white transition border border-zinc-700"
              >
                <span>NEXT #{String(Math.min(1025, pokemon.id + 1)).padStart(3, "0")}</span>
                <span>→</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
