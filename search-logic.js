// Suchlogik

// Gibt die Stammdaten zu einer Karte anhand der Pokedex-Nummer zurueck.
function getPokemonData(card) {
  return pokemonData.find((pokemon) => {
    return pokemon.pokedexNumber === card.pokedexNumber;
  });
}

// Gibt den englischen Pokemonnamen zu einer Karte zurueck.
function getEnglishPokemonName(card) {
  const matchingPokemon = getPokemonData(card);

  if (!matchingPokemon) {
    return "";
  }

  return matchingPokemon.englishName || "";
}

// Gibt den deutschen Pokemonnamen aus den Stammdaten zu einer Karte zurueck.
function getGermanPokemonName(card) {
  const matchingPokemon = getPokemonData(card);

  if (!matchingPokemon) {
    return "";
  }

  return matchingPokemon.germanName || "";
}

// Filtert Karten nach Pokemonname, Kartenname und Pokedex-Nummer.
function filterCardsBySearch(cards) {
  const searchText = searchInput.value.trim().toLowerCase();

  if (searchText === "") {
    return cards;
  }

  return cards.filter((card) => {
    const pokemonName = card.pokemonName.toLowerCase();
    const cardName = card.cardName.toLowerCase();
    const englishPokemonName = getEnglishPokemonName(card).toLowerCase();
    const germanPokemonName = getGermanPokemonName(card).toLowerCase();
    const pokedexNumber = String(card.pokedexNumber);

    return (
      pokemonName.includes(searchText) ||
      cardName.includes(searchText) ||
      englishPokemonName.includes(searchText) ||
      germanPokemonName.includes(searchText) ||
      pokedexNumber.includes(searchText)
    );
  });
}
