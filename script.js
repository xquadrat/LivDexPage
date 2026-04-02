const cardsContainer = document.getElementById("cardsContainer");
const cardsStatus = document.getElementById("cardsStatus");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

const showAllButton = document.getElementById("showAllButton");
const showGenerationButton = document.getElementById("showGenerationButton");
const showBinderButton = document.getElementById("showBinderButton");
const showMissingButton = document.getElementById("showMissingButton");
const toggleDisplayModeButton = document.getElementById("toggleDisplayModeButton");

const generationControls = document.getElementById("generationControls");
const binderControls = document.getElementById("binderControls");

const generationSelect = document.getElementById("generationSelect");
const binderSelect = document.getElementById("binderSelect");
const searchInput = document.getElementById("searchInput");

const generationRanges = {
  1: { start: 1, end: 151 },
  2: { start: 152, end: 251 },
  3: { start: 252, end: 386 },
  4: { start: 387, end: 493 },
  5: { start: 494, end: 649 },
  6: { start: 650, end: 721 },
  7: { start: 722, end: 809 },
  8: { start: 810, end: 905 },
  9: { start: 906, end: 1025 }
};

const binderRanges = {
  1: { start: 1, end: 360 },
  2: { start: 361, end: 720 },
  3: { start: 721, end: 1080 }
};

const cardsPerPage = 9;
let currentPage = 1;
let currentView = "all";
let displayMode = "paged";
let allCards = [];
let pokemonData = [];
let imageOverrides = [];

// Gibt alle fehlenden Karten zurueck.
function getMissingCards() {
  return allCards.filter((card) => {
    return card.isOwned === false;
  });
}

// Gibt Karten passend zu einem ausgewaehlten Bereich zurueck.
function getCardsByView(viewType, viewValue) {
  if (viewType === "generation") {
    const range = generationRanges[viewValue];
    return filterCardsByRange(allCards, range.start, range.end);
  }

  if (viewType === "binder") {
    const range = binderRanges[viewValue];
    return filterCardsByRange(allCards, range.start, range.end);
  }

  return allCards;
}

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

// Filtert Karten nach Pokemonname und Kartenname.
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

    return (
      pokemonName.includes(searchText) ||
      cardName.includes(searchText) ||
      englishPokemonName.includes(searchText) ||
      germanPokemonName.includes(searchText)
    );
  });
}

// Prueft im Browser, ob mindestens ein Bildkandidat fuer eine Karte laedt.
function cardHasLoadableImage(card) {
  const imageCandidates = getCardImageCandidates(card);

  if (imageCandidates.length === 0) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let currentIndex = 0;

    function tryNextImage() {
      if (currentIndex >= imageCandidates.length) {
        resolve(false);
        return;
      }

      const image = new Image();
      const imageUrl = imageCandidates[currentIndex];

      image.onload = () => resolve(true);
      image.onerror = () => {
        currentIndex += 1;
        tryNextImage();
      };

      image.src = imageUrl;
    }

    tryNextImage();
  });
}

// Sammelt alle Karten, fuer die mit der aktuellen Bildlogik kein Bild geladen werden kann.
window.collectMissingImageCards = async function collectMissingImageCards() {
  const missingCards = [];

  for (const card of allCards) {
    const hasLoadableImage = await cardHasLoadableImage(card);

    if (!hasLoadableImage) {
      missingCards.push({
        pokedexNumber: card.pokedexNumber,
        pokemonName: card.pokemonName,
        cardName: card.cardName,
        set: card.set,
        setExtra: card.setExtra,
        cardNumber: card.cardNumber,
        language: card.language,
        cardPageUrl: getCardPageUrl(card)
      });
    }
  }

  console.table(missingCards);
  return missingCards;
};

// Exportiert die Karten ohne ladbares Bild als JSON-Datei aus dem Browser.
window.exportMissingImageCards = async function exportMissingImageCards() {
  const missingCards = await window.collectMissingImageCards();
  const json = JSON.stringify(missingCards, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = "missing-image-cards.json";
  link.click();

  URL.revokeObjectURL(downloadUrl);

  return missingCards;
};

// Blendet die passenden Auswahlfelder fuer die aktuelle Ansicht ein oder aus.
function updateViewControls() {
  generationControls.style.display = currentView === "generation" ? "block" : "none";
  binderControls.style.display = currentView === "binder" ? "block" : "none";
}

// Markiert den aktuell aktiven Ansichtsbutton.
function updateActiveViewButton() {
  showAllButton.classList.remove("is-active");
  showGenerationButton.classList.remove("is-active");
  showBinderButton.classList.remove("is-active");
  showMissingButton.classList.remove("is-active");

  if (currentView === "all") {
    showAllButton.classList.add("is-active");
  }

  if (currentView === "generation") {
    showGenerationButton.classList.add("is-active");
  }

  if (currentView === "binder") {
    showBinderButton.classList.add("is-active");
  }

  if (currentView === "missing") {
    showMissingButton.classList.add("is-active");
  }
}

// Blendet den Umschaltbutton fuer die Gesamtanzeige passend ein oder aus.
function updateDisplayModeButton() {
  const shouldHideButton = currentView === "missing" || displayMode === "full";

  toggleDisplayModeButton.style.display = shouldHideButton ? "none" : "inline-block";
}

// Gibt die Kartenliste passend zur aktuellen Ansicht zurueck.
function getVisibleCards() {
  let visibleCards = [];

  if (currentView === "missing") {
    visibleCards = getMissingCards();
  } else if (currentView === "all") {
    visibleCards = allCards;
  } else if (currentView === "generation") {
    const generation = Number(generationSelect.value);

    if (!generation) {
      return [];
    }

    visibleCards = getCardsByView("generation", generation);
  } else if (currentView === "binder") {
    const binder = Number(binderSelect.value);

    if (!binder) {
      return [];
    }

    visibleCards = getCardsByView("binder", binder);
  }

  return filterCardsBySearch(visibleCards);
}

// Filtert Karten anhand eines Pokedex-Bereichs.
function filterCardsByRange(cards, start, end) {
  return cards.filter((card) => {
    return card.pokedexNumber >= start && card.pokedexNumber <= end;
  });
}

// Erstellt ein HTML-Element fuer eine einzelne Karte.
// Erstellt ein HTML-Element fuer eine einzelne Karte.
function createCardElement(card) {
  const cardElement = document.createElement("div");
  cardElement.classList.add("card");

  const ownedText = card.isOwned ? "Vorhanden" : "Fehlt";
  const cardNameText = card.cardName || "-";
  const currentCardText = card.set && card.cardNumber
    ? `${card.set} ${card.cardNumber}`
    : "-";
  const targetCardText = card.targetCardSet && card.targetCardNumber
    ? `${card.targetCardSet} ${card.targetCardNumber}`
    : "-";
  const imageOverride = getImageOverride(card);
  const imageCandidates = getCardImageCandidates(card);
  const cardPageUrl = getCardPageUrl(card);
  const imageSourceHint = imageOverride ? "Bild manuell zugewiesen" : "";

  cardElement.innerHTML = `
    <div class="card-image-wrapper">
      <img class="card-image" src="${imageCandidates[0] || ""}" alt="${card.pokemonName}">
      <div class="card-image-fallback">
        <p>Kein Bild verfügbar</p>
        <a class="card-link" href="${cardPageUrl}" target="_blank" rel="noopener noreferrer">Zur Kartenquelle</a>
      </div>
    </div>
      ${imageSourceHint ? `<p class="card-image-source">${imageSourceHint}</p>` : ""}
      <h3 class="card-title">${card.pokemonName}</h3>
    <p class="card-info"><strong>Kartenname:</strong> ${cardNameText}</p>
    <p class="card-info"><strong>Aktuelle Karte:</strong> ${currentCardText}</p>
    <p class="card-info"><strong>Zielkarte:</strong> ${targetCardText}</p>
    <p class="card-info"><strong>Besitzstatus:</strong> ${ownedText}</p>
  `;

  const imageElement = cardElement.querySelector(".card-image");

  let currentImageIndex = 0;

  imageElement.addEventListener("error", () => {
    currentImageIndex += 1;

    if (currentImageIndex < imageCandidates.length) {
      imageElement.src = imageCandidates[currentImageIndex];
      return;
    }

  cardElement.classList.add("card--image-error");
});


  return cardElement;
}

// Baut den Statustext passend zur aktuellen Ansicht.
function getStatusText(cards) {
  if (currentView === "missing") {
    return "Fehlende Karten";
  }

  if (currentView === "all") {
    return `Alle Karten, Seite ${currentPage}`;
  }

  if (currentView === "generation") {
    const generation = generationSelect.value || "?";
    return `Generation ${generation}, Seite ${currentPage}`;
  }

  if (currentView === "binder") {
    const binder = binderSelect.value || "?";
    return `Ordner ${binder}, Seite ${currentPage}`;
  }

  return "";
}

// Zeigt Karten im Kartenbereich an.
// In der Fehlend-Ansicht werden alle Karten angezeigt, sonst seitenweise.
function renderCards(cards) {
  cardsContainer.innerHTML = "";

  let cardsToRender = [];

  if (currentView === "missing" || displayMode === "full") {
    cardsToRender = cards;
  } else {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    cardsToRender = cards.slice(startIndex, endIndex);
  }

  cardsStatus.textContent = getStatusText(cards);

  cardsToRender.forEach((card) => {
    const cardElement = createCardElement(card);
    cardsContainer.appendChild(cardElement);
  });

  updatePaginationButtons(cards);
}

// Aktualisiert die Navigationsbuttons fuer die Kartenansicht.
// Aktualisiert die Navigationsbuttons fuer die Kartenansicht.
function updatePaginationButtons(cards) {
  if (currentView === "missing" || displayMode === "full") {
    previousButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  const maxPage = Math.ceil(cards.length / cardsPerPage);

  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === maxPage || maxPage === 0;
}

Promise.all([
  fetch("data/cards.json").then((response) => response.json()),
  fetch("data/pokemon-data.json").then((response) => response.json()),
  fetch("data/image-overrides.json").then((response) => response.json())
]).then(([cards, pokemon, overrides]) => {
  allCards = cards;
  pokemonData = pokemon;
  imageOverrides = overrides;
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

showAllButton.addEventListener("click", () => {
  currentView = "all";
  displayMode = "paged";
  currentPage = 1;
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

showGenerationButton.addEventListener("click", () => {
  currentView = "generation";
  displayMode = "paged";
  currentPage = 1;
  generationSelect.value = "1";
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

showBinderButton.addEventListener("click", () => {
  currentView = "binder";
  displayMode = "paged";
  currentPage = 1;
  binderSelect.value = "1";
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

showMissingButton.addEventListener("click", () => {
  currentView = "missing";
  displayMode = "full";
  currentPage = 1;
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

generationSelect.addEventListener("change", () => {
  currentPage = 1;
  displayMode = "paged";
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

binderSelect.addEventListener("change", () => {
  currentPage = 1;
  displayMode = "paged";
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

previousButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderCards(getVisibleCards());
  }
});

nextButton.addEventListener("click", () => {
  const visibleCards = getVisibleCards();
  const maxPage = Math.ceil(visibleCards.length / cardsPerPage);

  if (currentPage < maxPage) {
    currentPage += 1;
    renderCards(visibleCards);
  }
});

toggleDisplayModeButton.addEventListener("click", () => {
  if (currentView === "missing") {
    return;
  }

  displayMode = displayMode === "paged" ? "full" : "paged";
  currentPage = 1;
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderCards(getVisibleCards());
});

