import { useState, useEffect } from "react";
import { TYPE_COLORS } from "../utils/typeChart";
import { playPokedexBeep, playPokedexOpen } from "../utils/audio";
import { isFavorite, toggleFavorite } from "../utils/favorites";

function PokemonCard({ pokemon, onSelect }) {
  const [favorite, setFavorite] = useState(() => isFavorite(pokemon.id));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    function handleFavChange() {
      setFavorite(isFavorite(pokemon.id));
    }
    window.addEventListener("pokedex_favorites_changed", handleFavChange);
    return () => window.removeEventListener("pokedex_favorites_changed", handleFavChange);
  }, [pokemon.id]);

  const primaryType = pokemon.types?.[0]?.type?.name || "normal";
  const primaryColorData = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
  const primaryColor = primaryColorData.bg;

  const officialArtwork =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default;

  const animatedShowdown =
    pokemon.sprites?.other?.showdown?.front_default || officialArtwork;

  const displayImage = isHovered && animatedShowdown ? animatedShowdown : officialArtwork;

  // Calculate Base Stat Total
  const totalStats = (pokemon.stats || []).reduce(
    (acc, s) => acc + (s.base_stat || 0),
    0
  );

  function handleCardClick() {
    playPokedexOpen();
    if (onSelect) onSelect(pokemon);
  }

  function handleFavoriteClick(e) {
    e.stopPropagation();
    playPokedexBeep();
    const newStatus = toggleFavorite(pokemon.id);
    setFavorite(newStatus);
  }

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-red-400/50 hover:shadow-2xl"
    >
      {/* Top Background Screen & Halo */}
      <div
        className="relative h-60 overflow-hidden transition-colors duration-500"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}25 0%, #ffffff 90%)`,
        }}
      >
        {/* Pokeball watermark in background */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full border-12 border-black/5 opacity-50 transition-transform duration-700 group-hover:rotate-45" />

        {/* Pokedex Entry ID */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 backdrop-blur-sm shadow-sm border border-black/5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <p className="font-mono text-xs font-black tracking-wider text-gray-700">
            #{String(pokemon.id).padStart(3, "0")}
          </p>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={favorite ? "Remove favorite" : "Add to favorites"}
          className={`absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 shadow-sm ${
            favorite
              ? "bg-rose-500 text-white shadow-rose-300"
              : "bg-white/80 text-gray-400 hover:text-rose-500 backdrop-blur-sm"
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        {/* Dynamic Type Glow Aura */}
        <div
          className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundColor: `${primaryColor}40` }}
        />

        {/* Pokemon Image */}
        <img
          src={displayImage}
          alt={pokemon.name}
          loading="lazy"
          className="absolute left-1/2 top-1/2 z-10 max-h-48 max-w-48 -translate-x-1/2 -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
        />
      </div>

      {/* Info Section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 group-hover:text-[#DC0A2D] transition-colors">
            {pokemon.name}
          </h2>

          {/* Type Badges */}
          <div className="flex flex-wrap justify-end gap-1">
            {pokemon.types?.map((item) => {
              const type = item.type.name;
              const typeColorData = TYPE_COLORS[type] || TYPE_COLORS.normal;

              return (
                <span
                  key={type}
                  className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-xs"
                  style={{
                    backgroundColor: `${typeColorData.bg}22`,
                    color: typeColorData.bg,
                    border: `1px solid ${typeColorData.bg}40`,
                  }}
                >
                  {type}
                </span>
              );
            })}
          </div>
        </div>

        {/* Specs & Base Stats Bar */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Height
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-gray-800">
              {(pokemon.height / 10).toFixed(1)}m
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Weight
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-gray-800">
              {(pokemon.weight / 10).toFixed(1)}kg
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              BST Stat
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-emerald-600">
              {totalStats || "—"}
            </p>
          </div>
        </div>

        {/* Pokédex Launch Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-100 bg-gray-50 py-2.5 text-xs font-black uppercase tracking-wider text-gray-700 transition duration-200 group-hover:border-[#DC0A2D] group-hover:bg-[#DC0A2D] group-hover:text-white group-hover:shadow-lg group-hover:shadow-red-500/25"
        >
          <span className="h-2 w-2 rounded-full bg-red-500 group-hover:bg-white animate-pulse" />
          <span>View Pokédex Entry</span>
        </button>
      </div>
    </article>
  );
}

export default PokemonCard;
