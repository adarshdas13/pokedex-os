// Official Pokemon Types, Colors, and Battle Effectiveness Chart

export const POKEMON_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "steel", "dark", "fairy",
];

export const TYPE_COLORS = {
  normal: { bg: "#A8A878", text: "#FFFFFF", light: "#A8A87825" },
  fire: { bg: "#F08030", text: "#FFFFFF", light: "#F0803025" },
  water: { bg: "#6890F0", text: "#FFFFFF", light: "#6890F025" },
  grass: { bg: "#78C850", text: "#FFFFFF", light: "#78C85025" },
  electric: { bg: "#F8D030", text: "#171717", light: "#F8D03025" },
  ice: { bg: "#98D8D8", text: "#171717", light: "#98D8D825" },
  fighting: { bg: "#C03028", text: "#FFFFFF", light: "#C0302825" },
  poison: { bg: "#A040A0", text: "#FFFFFF", light: "#A040A025" },
  ground: { bg: "#E0C068", text: "#171717", light: "#E0C06825" },
  flying: { bg: "#A890F0", text: "#FFFFFF", light: "#A890F025" },
  psychic: { bg: "#F85888", text: "#FFFFFF", light: "#F8588825" },
  bug: { bg: "#A8B820", text: "#FFFFFF", light: "#A8B82025" },
  rock: { bg: "#B8A038", text: "#FFFFFF", light: "#B8A03825" },
  ghost: { bg: "#705898", text: "#FFFFFF", light: "#70589825" },
  dragon: { bg: "#7038F8", text: "#FFFFFF", light: "#7038F825" },
  steel: { bg: "#B8B8D0", text: "#171717", light: "#B8B8D025" },
  dark: { bg: "#705848", text: "#FFFFFF", light: "#70584825" },
  fairy: { bg: "#EE99AC", text: "#171717", light: "#EE99AC25" },
};

// Attacker -> Defender multiplier matrix
// attacker: { defender: multiplier }
const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/**
 * Calculates defensive damage multipliers for a Pokemon with given type(s).
 * @param {string[]} defenderTypes - Array of type names (e.g. ['grass', 'poison'])
 * @returns {{ weaknesses: {type: string, multiplier: number}[], resistances: {type: string, multiplier: number}[], immunities: string[] }}
 */
export function getTypeMatchups(defenderTypes = []) {
  const result = {
    weaknesses: [],
    resistances: [],
    immunities: [],
  };

  if (!defenderTypes || defenderTypes.length === 0) return result;

  POKEMON_TYPES.forEach((attackerType) => {
    let multiplier = 1;

    defenderTypes.forEach((defType) => {
      const typeLow = defType.toLowerCase();
      const eff = TYPE_EFFECTIVENESS[attackerType]?.[typeLow];
      if (eff !== undefined) {
        multiplier *= eff;
      }
    });

    if (multiplier === 0) {
      result.immunities.push(attackerType);
    } else if (multiplier > 1) {
      result.weaknesses.push({ type: attackerType, multiplier });
    } else if (multiplier < 1) {
      result.resistances.push({ type: attackerType, multiplier });
    }
  });

  // Sort weaknesses highest damage first
  result.weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  result.resistances.sort((a, b) => a.multiplier - b.multiplier);

  return result;
}

// Region boundary definitions
export const REGIONS = [
  { id: "all", name: "All Generations", range: [1, 1025], count: 1025 },
  { id: "kanto", name: "Kanto (Gen I)", range: [1, 151], count: 151 },
  { id: "johto", name: "Johto (Gen II)", range: [152, 251], count: 100 },
  { id: "hoenn", name: "Hoenn (Gen III)", range: [252, 386], count: 135 },
  { id: "sinnoh", name: "Sinnoh (Gen IV)", range: [387, 493], count: 107 },
  { id: "unova", name: "Unova (Gen V)", range: [494, 649], count: 156 },
  { id: "kalos", name: "Kalos (Gen VI)", range: [650, 721], count: 72 },
  { id: "alola", name: "Alola (Gen VII)", range: [722, 809], count: 88 },
  { id: "galar", name: "Galar (Gen VIII)", range: [810, 905], count: 96 },
  { id: "paldea", name: "Paldea (Gen IX)", range: [906, 1025], count: 120 },
];

