// Favorites & Team Builder Manager stored in localStorage

const STORAGE_KEY = "pokedex_favorites";

export function getFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  const numId = Number(id);
  const favs = getFavorites();
  return favs.includes(numId);
}

export function toggleFavorite(id) {
  const numId = Number(id);
  const favs = getFavorites();
  const willBeAdded = !favs.includes(numId);
  const updated = willBeAdded
    ? [...favs, numId]
    : favs.filter((item) => item !== numId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pokedex_favorites_changed", { detail: updated }));
  } catch (err) {
    console.error("Failed to save favorites", err);
  }

  return willBeAdded;
}
