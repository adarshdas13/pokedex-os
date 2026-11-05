import { useEffect, useState, useMemo } from "react";
import { getPokemon, getAllPokemonIndex, getPokemonByType } from "../services/pokeapi";
import { POKEMON_TYPES, REGIONS } from "../utils/typeChart";
import { playPokedexBeep, playPokedexOpen } from "../utils/audio";
import { getFavorites } from "../utils/favorites";
import PokemonCard from "./PokemonCard";
import PokedexModal from "./PokedexModal";

const POKEMON_PER_PAGE = 18;

function PokemonGrid({ onSelectPokemon }) {
  // Global & filtered Pokemon index
  const [globalIndex, setGlobalIndex] = useState([]);
  const [typePokemonList, setTypePokemonList] = useState(null);
  const [typeLoading, setTypeLoading] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("kanto");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("id-asc"); // 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'
  
  // Page state
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPokemon, setLoadedPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal active Pokemon (fallback if uncontrolled)
  const [activeModalPokemon, setActiveModalPokemon] = useState(null);

  // Favorites trigger update
  const [favoritesList, setFavoritesList] = useState(() => getFavorites());

  // Listen to favorite updates from anywhere in the app
  useEffect(() => {
    function handleFavChange(e) {
      setFavoritesList(e.detail || getFavorites());
    }
    window.addEventListener("pokedex_favorites_changed", handleFavChange);
    return () => window.removeEventListener("pokedex_favorites_changed", handleFavChange);
  }, []);

  // Load global index on mount for lightning fast multi-generational search
  useEffect(() => {
    let cancelled = false;
    async function loadIndex() {
      try {
        const index = await getAllPokemonIndex();
        if (!cancelled && index.length > 0) {
          setGlobalIndex(index);
        }
      } catch (err) {
        console.error("Failed to load global index", err);
      }
    }
    loadIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch Pokemon for selected elemental type to filter before pagination
  useEffect(() => {
    if (selectedType === "all") return;

    let cancelled = false;

    async function loadTypePokemon() {
      setTypeLoading(true);
      try {
        const list = await getPokemonByType(selectedType);
        if (!cancelled) {
          setTypePokemonList(list);
        }
      } catch (err) {
        console.error("Failed to load type pokemon:", err);
      } finally {
        if (!cancelled) setTypeLoading(false);
      }
    }

    loadTypePokemon();

    return () => {
      cancelled = true;
    };
  }, [selectedType]);


  // Filter list based on Type, Region, Search Query, and Favorites
  const filteredIndex = useMemo(() => {
    // If a type filter is active, start with the type's Pokemon list
    let list = selectedType === "all" ? globalIndex : (typePokemonList || []);

    if (list.length === 0 && selectedType === "all") {
      // Fallback to Kanto 151 if index isn't ready yet
      list = Array.from({ length: 151 }, (_, i) => ({
        id: i + 1,
        name: `pokemon-${i + 1}`,
      }));
    }

    // 1. Filter by Region (if not searching across all or if user picked a region)
    const currentRegion = REGIONS.find((r) => r.id === selectedRegion);
    if (currentRegion && currentRegion.id !== "all" && !searchQuery.trim()) {
      const [startId, endId] = currentRegion.range;
      list = list.filter((p) => p.id >= startId && p.id <= endId);
    }

    // 2. Filter by Search Query (name or number)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const isNum = !isNaN(Number(query));
      list = list.filter((p) => {
        if (isNum) {
          return String(p.id).includes(query) || p.id === Number(query);
        }
        return p.name.toLowerCase().includes(query);
      });
    }

    // 3. Filter by Favorites
    if (showFavoritesOnly) {
      list = list.filter((p) => favoritesList.includes(p.id));
    }

    // 4. Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "id-desc") return b.id - a.id;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return a.id - b.id; // default id-asc
    });

    return list;
  }, [globalIndex, typePokemonList, selectedType, selectedRegion, searchQuery, showFavoritesOnly, favoritesList, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredIndex.length / POKEMON_PER_PAGE));

  // Handler helpers that reset page to 1 on filter changes
  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  function handleClearSearch() {
    setSearchQuery("");
    setCurrentPage(1);
  }

  function handleRegionChange(e) {
    playPokedexBeep();
    setSelectedRegion(e.target.value);
    setCurrentPage(1);
  }

  function handleSortChange(e) {
    playPokedexBeep();
    setSortBy(e.target.value);
    setCurrentPage(1);
  }

  function handleToggleFavorites() {
    playPokedexBeep();
    setShowFavoritesOnly((prev) => !prev);
    setCurrentPage(1);
  }

  function handleTypeSelect(type) {
    playPokedexBeep();
    const nextType = type === selectedType ? "all" : type;
    setSelectedType(nextType);
    if (nextType === "all") {
      setTypePokemonList(null);
      setTypeLoading(false);
    }
    setCurrentPage(1);
  }


  // Load actual Pokemon data for current page slice
  useEffect(() => {
    let cancelled = false;

    async function fetchPagePokemon() {
      setLoading(true);
      setError("");

      try {
        const startIndex = (currentPage - 1) * POKEMON_PER_PAGE;
        const pageItems = filteredIndex.slice(
          startIndex,
          startIndex + POKEMON_PER_PAGE
        );

        if (pageItems.length === 0) {
          if (!cancelled) {
            setLoadedPokemon([]);
            setLoading(false);
          }
          return;
        }

        // Fetch each Pokemon's full details
        const results = await Promise.all(
          pageItems.map(async (item) => {
            try {
              return await getPokemon(item.id);
            } catch (err) {
              console.error(`Failed to load ${item.id}`, err);
              return null;
            }
          })
        );

        if (!cancelled) {
          setLoadedPokemon(results.filter(Boolean));
        }
      } catch (err) {
        console.error("PokemonGrid fetch error:", err);
        if (!cancelled) {
          setError("Failed to communicate with Pokédex database.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPagePokemon();

    return () => {
      cancelled = true;
    };
  }, [filteredIndex, currentPage]);

  function handleSelectPokemon(poke) {
    if (onSelectPokemon) {
      onSelectPokemon(poke);
    } else {
      setActiveModalPokemon(poke);
    }
  }

  function handleRandomPokemon() {
    playPokedexOpen();
    const randomId = Math.floor(Math.random() * 1025) + 1;
    getPokemon(randomId)
      .then((poke) => {
        handleSelectPokemon(poke);
      })
      .catch((err) => console.error("Random poke failed", err));
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) return;
    playPokedexBeep();
    setCurrentPage(page);

    const elem = document.getElementById("pokemon");
    if (elem) {
      window.scrollTo({
        top: elem.offsetTop - 70,
        behavior: "smooth",
      });
    }
  }

  const isDataLoading = loading || typeLoading;

  return (
    <section id="pokemon" className="relative bg-[#f8fafc] min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* POKEDEX HEADER & SEARCH CONSOLE */}
        <div className="rounded-3xl bg-[#DC0A2D] p-6 sm:p-8 shadow-xl border-4 border-[#a30822] text-white mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b-2 border-red-800/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 font-mono text-xs font-bold text-red-200 uppercase tracking-widest mb-2 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                DEX SEARCH MATRIX • ONLINE
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Pokédex Explorer
              </h2>
              <p className="mt-1 text-sm text-red-100 max-w-xl">
                Search, filter, and inspect detailed specs, stats, cries, and evolution trees.
              </p>
            </div>

            {/* Quick Actions (Random Surprise & Total Entries) */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRandomPokemon}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#DC0A2D] shadow-md hover:bg-red-50 transition active:scale-95"
                title="Open a surprise random Pokemon entry"
              >
                <span>🎲</span>
                <span>Random Pokémon</span>
              </button>

              <div className="rounded-xl bg-black/40 px-4 py-2 text-right border border-white/10">
                <span className="block font-mono text-[10px] text-red-200 uppercase tracking-wider">
                  TOTAL FOUND
                </span>
                <span className="font-mono text-lg font-black text-white">
                  {filteredIndex.length}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>

              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or number (e.g. 'Pikachu' or '25')..."
                className="w-full rounded-xl bg-black/35 py-3 pl-10 pr-10 text-sm text-white placeholder-red-200/60 border border-white/15 focus:border-white focus:bg-black/50 focus:outline-none transition shadow-inner font-medium"
              />

              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-200 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Region / Generation Selector */}
            <div className="md:col-span-3">
              <select
                value={selectedRegion}
                onChange={handleRegionChange}
                className="w-full rounded-xl bg-black/35 py-3 px-3 text-sm text-white border border-white/15 focus:border-white focus:outline-none font-medium cursor-pointer"
              >
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id} className="bg-zinc-900 text-white">
                    {region.name} ({region.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full rounded-xl bg-black/35 py-3 px-3 text-sm text-white border border-white/15 focus:border-white focus:outline-none font-medium cursor-pointer"
              >
                <option value="id-asc" className="bg-zinc-900 text-white">Number: Low to High</option>
                <option value="id-desc" className="bg-zinc-900 text-white">Number: High to Low</option>
                <option value="name-asc" className="bg-zinc-900 text-white">Name: A to Z</option>
                <option value="name-desc" className="bg-zinc-900 text-white">Name: Z to A</option>
              </select>
            </div>

            {/* Favorites Filter Toggle */}
            <div className="md:col-span-2">
              <button
                onClick={handleToggleFavorites}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-sm font-bold transition shadow-sm border ${
                  showFavoritesOnly
                    ? "bg-rose-500 text-white border-rose-300 shadow-rose-950/40"
                    : "bg-black/35 text-red-100 hover:text-white border-white/15 hover:bg-black/45"
                }`}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>{showFavoritesOnly ? "Favorites Only" : `Favorites (${favoritesList.length})`}</span>
              </button>
            </div>
          </div>

          {/* ELEMENTAL TYPE FILTER CHIPS */}
          <div className="mt-5 pt-4 border-t border-red-800/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <span className="font-mono text-[10px] text-red-200 font-bold uppercase tracking-widest shrink-0 mr-1">
                TYPE:
              </span>

              <button
                onClick={() => handleTypeSelect("all")}
                className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider transition shrink-0 ${
                  selectedType === "all"
                    ? "bg-white text-[#DC0A2D] shadow-md"
                    : "bg-black/30 text-red-100 hover:bg-black/40"
                }`}
              >
                All Types
              </button>

              {POKEMON_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider transition shrink-0 ${
                    selectedType === type
                      ? "bg-white text-gray-900 shadow-md ring-2 ring-white"
                      : "bg-black/30 text-red-100 hover:bg-black/40 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center mb-8">
            <p className="text-lg font-black text-[#DC0A2D]">{error}</p>
            <p className="mt-1 text-sm text-gray-600">
              Please check your connection and try refreshing the Pokédex database.
            </p>
          </div>
        )}

        {/* POKEMON CARDS GRID */}
        {isDataLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: POKEMON_PER_PAGE }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between shadow-sm"
              >
                <div className="h-44 w-full rounded-xl bg-gray-200/70" />
                <div className="space-y-3 pt-4">
                  <div className="h-6 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-10 w-full rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : loadedPokemon.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loadedPokemon.map((poke) => (
              <PokemonCard
                key={poke.id}
                pokemon={poke}
                onSelect={handleSelectPokemon}
              />
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white p-12 text-center my-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-[#DC0A2D]">
              🔍
            </div>
            <h3 className="mt-4 text-xl font-black text-gray-900">
              No Pokémon Discovered
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              No entries found matching your search or filters. Try adjusting your search term, region, or active type filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
                setTypePokemonList(null);
                setTypeLoading(false);
                setSelectedRegion("all");
                setShowFavoritesOnly(false);
                setCurrentPage(1);
              }}
              className="mt-6 rounded-xl bg-[#DC0A2D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#b00824] transition"
            >
              Reset Filters
            </button>

          </div>
        )}

        {/* PAGINATION BAR */}
        {!isDataLoading && totalPages > 1 && (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-[#DC0A2D] hover:text-[#DC0A2D] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>

            {/* First Page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:border-[#DC0A2D] hover:text-[#DC0A2D]"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-1 text-gray-400 font-mono">...</span>}
              </>
            )}

            {/* Page number window */}
            {Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
              .filter((page) => page >= 1 && page <= totalPages)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-black transition shadow-sm ${
                    currentPage === page
                      ? "bg-[#DC0A2D] text-white shadow-red-500/30"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-[#DC0A2D] hover:text-[#DC0A2D]"
                  }`}
                >
                  {page}
                </button>
              ))}

            {/* Last Page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="px-1 text-gray-400 font-mono">...</span>}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm hover:border-[#DC0A2D] hover:text-[#DC0A2D]"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-[#DC0A2D] hover:text-[#DC0A2D] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* POKEDEX MODAL DEVICE INSPECTOR (FALLBACK IF UNCONTROLLED) */}
      {!onSelectPokemon && activeModalPokemon && (
        <PokedexModal
          pokemon={activeModalPokemon}
          onClose={() => setActiveModalPokemon(null)}
          onNavigate={(newPoke) => setActiveModalPokemon(newPoke)}
        />
      )}
    </section>
  );
}

export default PokemonGrid;
