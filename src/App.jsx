import { useState } from "react";
import "./App.css";
import Navbar from "./components/NavBar";
import Hero from "./components/Hero";
import PokemonGrid from "./components/PokemonGrid";
import PokedexModal from "./components/PokedexModal";
import { getPokemon } from "./services/pokeapi";
import { playPokedexOpen } from "./utils/audio";

export default function App() {
  const [activePokemon, setActivePokemon] = useState(null);

  async function handleRandomPokemon() {
    playPokedexOpen();
    const randomId = Math.floor(Math.random() * 1025) + 1;
    try {
      const data = await getPokemon(randomId);
      setActivePokemon(data);
    } catch (err) {
      console.error("Failed to fetch random pokemon", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#171717] font-sans antialiased flex flex-col selection:bg-red-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Hero
          onRandomPokemon={handleRandomPokemon}
          onSelectPokemon={(poke) => setActivePokemon(poke)}
        />
        <PokemonGrid onSelectPokemon={(poke) => setActivePokemon(poke)} />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-white bg-linear-to-br from-[#28AAFD] to-[#014f86] shadow-[0_0_8px_#28AAFD]" />
            <span className="font-mono text-xs font-black uppercase tracking-widest text-gray-800">
              <p className="font-mono text-[11px] text-gray-400">
                Built BY ADARSH DAS
              </p>
              <a href="https://github.com/adarshdas13">Github |</a>
              <a href="https://linkedin.com/adarshdas13"> LinkedIn</a>
            </span>
          </div>

          <p className="max-w-md text-xs text-gray-400">
            Powered by PokeAPI • All Pokémon content and materials are
            trademarks and copyrights of Nintendo, Game Freak, and The Pokémon
            Company.
          </p>
        </div>
      </footer>

      {/* GLOBAL POKÉDEX DEVICE MODAL */}
      {activePokemon && (
        <PokedexModal
          key={activePokemon.id}
          pokemon={activePokemon}
          onClose={() => setActivePokemon(null)}
          onNavigate={(newPoke) => setActivePokemon(newPoke)}
        />
      )}
    </div>
  );
}
