// Steuerelemente

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

// Bereichsdefinitionen

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

// Ansichtszustand

const cardsPerPage = 9;
let currentPage = 1;
let currentView = "all";
let displayMode = "paged";
let allCards = [];
let pokemonData = [];
let imageOverrides = [];

// Bilddiagnose

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

// Rendering

function createCardElement(card) {
  const cardElement = document.createElement("div");
  cardElement.classList.add("card");

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
  const imageSourceHint = imageOverride ? "Bild ggf. nicht in der richtigen Sprache" : "";

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

// Initialisierung

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

// Event-Listener

showAllButton.addEventListener("click", () => {
  currentView = "all";
  displayMode = "paged";
  currentPage = 1;
  clearSearchInput();
  updateViewControls();
  updateActiveViewButton();
  updateDisplayModeButton();
  renderCards(getVisibleCards());
});

showGenerationButton.addEventListener("click", () => {
  currentView = "generation";
  displayMode = "paged";
  currentPage = 1;
  clearSearchInput();
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
  clearSearchInput();
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
  clearSearchInput();
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

