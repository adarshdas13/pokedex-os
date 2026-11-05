const API_URL = "https://pokeapi.co/api/v2";

// In-memory cache to make navigation lightning fast
const cache = new Map();
let allPokemonIndexPromise = null;

export async function getPokemonList(limit = 24, offset = 0) {
  const cacheKey = `list_${limit}_${offset}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await fetch(`${API_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error("Failed to fetch Pokémon list");
  }

  const data = await response.json();
  cache.set(cacheKey, data);
  return data;
}

export async function getPokemon(idOrUrl) {
  const isUrl = typeof idOrUrl === "string" && idOrUrl.startsWith("http");
  const url = isUrl ? idOrUrl : `${API_URL}/pokemon/${idOrUrl}`;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokémon: ${idOrUrl}`);
  }

  const data = await response.json();
  cache.set(url, data);
  if (data.id) {
    cache.set(`${API_URL}/pokemon/${data.id}`, data);
  }
  return data;
}

// Fetch all Pokemon of a specific type (e.g. 'ice', 'fire') for pre-pagination filtering
export async function getPokemonByType(typeName) {
  const typeKey = `type_${typeName.toLowerCase()}`;
  if (cache.has(typeKey)) {
    return cache.get(typeKey);
  }

  try {
    const response = await fetch(`${API_URL}/type/${typeName.toLowerCase()}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    const list = (data.pokemon || [])
      .map((entry) => {
        const parts = entry.pokemon.url.split("/").filter(Boolean);
        const id = parseInt(parts[parts.length - 1], 10);
        return {
          id,
          name: entry.pokemon.name,
          url: entry.pokemon.url,
        };
      })
      .filter((p) => p.id <= 1025); // Exclude non-standard special forms above 1025

    cache.set(typeKey, list);
    return list;
  } catch (err) {
    console.error(`Failed to fetch type ${typeName}:`, err);
    return [];
  }
}

export async function getPokemonSpecies(idOrName) {
  const isUrl = typeof idOrName === "string" && idOrName.startsWith("http");
  const url = isUrl ? idOrName : `${API_URL}/pokemon-species/${idOrName}`;

  if (cache.has(url)) {
    return cache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Extract English flavor texts
    const englishEntries = (data.flavor_text_entries || [])
      .filter((entry) => entry.language.name === "en")
      .map((entry) =>
        entry.flavor_text
          .replace(/\f/g, " ")
          .replace(/\n/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      );

    // Pick one good, modern English description (latest official entry)
    const description =
      englishEntries[englishEntries.length - 1] ||
      englishEntries[0] ||
      "A mysterious Pokémon recorded in the national Pokédex.";

    // Find English genus / category (e.g. "Seed Pokémon")
    const englishGenus =
      data.genera?.find((g) => g.language.name === "en")?.genus || "Pokémon";

    const parsed = {
      ...data,
      description,
      englishGenus,
      evolutionChainUrl: data.evolution_chain?.url || null,
      generation: data.generation?.name || "generation-i",
      captureRate: data.capture_rate,
      baseHappiness: data.base_happiness,
      genderRate: data.gender_rate, // -1 = genderless, else eighths of female
      eggGroups: (data.egg_groups || []).map((eg) => eg.name),
      isLegendary: data.is_legendary || false,
      isMythical: data.is_mythical || false,
    };

    cache.set(url, parsed);
    return parsed;
  } catch (err) {
    console.error("Error fetching species:", err);
    return null;
  }
}

// Parse recursive evolution chain into sequential stages
export async function getEvolutionChain(url) {
  if (!url) return [];
  if (cache.has(url)) {
    return cache.get(url);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const chainList = [];

    function traverse(node) {
      if (!node || !node.species) return;

      // Extract species ID from URL
      const parts = node.species.url.split("/").filter(Boolean);
      const id = parseInt(parts[parts.length - 1], 10);

      let triggerDesc = "";
      if (node.evolution_details && node.evolution_details.length > 0) {
        const details = node.evolution_details[0];
        if (details.min_level) {
          triggerDesc = `Lvl ${details.min_level}`;
        } else if (details.item) {
          triggerDesc = details.item.name.replace(/-/g, " ");
        } else if (details.trigger?.name === "trade") {
          triggerDesc = details.held_item
            ? `Trade (${details.held_item.name.replace(/-/g, " ")})`
            : "Trade";
        } else if (details.min_happiness) {
          triggerDesc = "High Friendship";
        } else if (details.trigger?.name) {
          triggerDesc = details.trigger.name.replace(/-/g, " ");
        }
      }

      chainList.push({
        id,
        name: node.species.name,
        trigger: triggerDesc,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        animatedSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`,
      });

      if (node.evolves_to && node.evolves_to.length > 0) {
        node.evolves_to.forEach(traverse);
      }
    }

    traverse(data.chain);
    cache.set(url, chainList);
    return chainList;
  } catch (err) {
    console.error("Error fetching evolution chain:", err);
    return [];
  }
}

// Fetch complete lightweight index (1-1025) for instant search across all Pokemon
export async function getAllPokemonIndex() {
  if (allPokemonIndexPromise) {
    return allPokemonIndexPromise;
  }

  allPokemonIndexPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/pokemon?limit=1025&offset=0`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.results.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        url: item.url,
      }));
    } catch (err) {
      console.error("Failed to load global Pokemon index:", err);
      return [];
    }
  })();

  return allPokemonIndexPromise;
}
