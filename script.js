const cardsContainer = document.getElementById("cardsContainer");
const cardsStatus = document.getElementById("cardsStatus");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

const showAllButton = document.getElementById("showAllButton");
const showGenerationButton = document.getElementById("showGenerationButton");
const showBinderButton = document.getElementById("showBinderButton");
const showMissingButton = document.getElementById("showMissingButton");

const generationControls = document.getElementById("generationControls");
const binderControls = document.getElementById("binderControls");

const generationSelect = document.getElementById("generationSelect");
const binderSelect = document.getElementById("binderSelect");

const languageCodes = {
  Deutsch: "DE",
  Englisch: "EN",
  Japanisch: "JA",
  Niederlaendisch: "NL",
  Franzoesisch: "FR",
  Italienisch: "IT",
  Spanisch: "ES",
  Portugiesisch: "PT",
  Koreanisch: "KO",
  Chinesisch: "ZH",
  Russisch: "RU",
  Polnisch: "PL"
};

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
let allCards = [];
let currentView = "all";

// Gibt alle fehlenden Karten zurueck.
function getMissingCards() {
  return allCards.filter((card) => {
    return card.isOwned === false;
  });
}

// Baut die Bild-URL fuer eine Karte.
function getCardImageUrl(card) {
  if (!card.set || !card.cardNumber) {
    return "";
  }

  const languageCode = card.language === "Deutsch" ? "DE" : "EN";

  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set}/${card.set}_${card.cardNumber}_R_${languageCode}_LG.png`;
}

// Baut die Limitless-Seiten-URL fuer eine Karte.
function getCardPageUrl(card) {
  if (!card.set || !card.cardNumber) {
    return "";
  }

  const cardNumber = Number(card.cardNumber);
  const isJapaneseCard = card.language === "Japanisch";

  if (isJapaneseCard) {
    return `https://limitlesstcg.com/cards/jp/${card.set}/${cardNumber}`;
  }

  return `https://limitlesstcg.com/cards/${card.set}/${cardNumber}`;
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

// Blendet die passenden Auswahlfelder fuer die aktuelle Ansicht ein oder aus.
function updateViewControls() {
  generationControls.style.display = currentView === "generation" ? "block" : "none";
  binderControls.style.display = currentView === "binder" ? "block" : "none";
}

// Gibt die Kartenliste passend zur aktuellen Ansicht zurueck.
function getVisibleCards() {
  if (currentView === "missing") {
    return getMissingCards();
  }

  if (currentView === "all") {
    return allCards;
  }

  if (currentView === "generation") {
    const generation = Number(generationSelect.value);

    if (!generation) {
      return [];
    }

    return getCardsByView("generation", generation);
  }

  if (currentView === "binder") {
    const binder = Number(binderSelect.value);

    if (!binder) {
      return [];
    }

    return getCardsByView("binder", binder);
  }

  return [];
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
  const imageUrl = getCardImageUrl(card);
  const cardPageUrl = getCardPageUrl(card);

  cardElement.innerHTML = `
    <div class="card-image-wrapper">
      <img class="card-image" src="${imageUrl}" alt="${card.pokemonName}">
      <div class="card-image-fallback">
        <p>Kein Bild verfügbar</p>
        <a class="card-link" href="${cardPageUrl}" target="_blank" rel="noopener noreferrer">Zur Kartenquelle</a>
      </div>
    </div>
    <h3 class="card-title">${card.pokemonName}</h3>
    <p class="card-info"><strong>Kartenname:</strong> ${cardNameText}</p>
    <p class="card-info"><strong>Aktuelle Karte:</strong> ${currentCardText}</p>
    <p class="card-info"><strong>Zielkarte:</strong> ${targetCardText}</p>
    <p class="card-info"><strong>Besitzstatus:</strong> ${ownedText}</p>
  `;

  const imageElement = cardElement.querySelector(".card-image");

  imageElement.addEventListener("error", () => {
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

  if (currentView === "missing") {
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
  if (currentView === "missing") {
    previousButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  const maxPage = Math.ceil(cards.length / cardsPerPage);

  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === maxPage || maxPage === 0;
}

fetch("data/cards.json")
  .then((response) => response.json())
  .then((cards) => {
    allCards = cards;
    updateViewControls();
    renderCards(getVisibleCards());
});

showAllButton.addEventListener("click", () => {
  currentView = "all";
  currentPage = 1;
  updateViewControls();
  renderCards(getVisibleCards());
});

showGenerationButton.addEventListener("click", () => {
  currentView = "generation";
  currentPage = 1;
  generationSelect.value = "1";
  updateViewControls();
  renderCards(getVisibleCards());
});

showBinderButton.addEventListener("click", () => {
  currentView = "binder";
  currentPage = 1;
  binderSelect.value = "1";
  updateViewControls();
  renderCards(getVisibleCards());
});

showMissingButton.addEventListener("click", () => {
  currentView = "missing";
  currentPage = 1;
  updateViewControls();
  renderCards(getVisibleCards());
});

generationSelect.addEventListener("change", () => {
  currentPage = 1;
  renderCards(getVisibleCards());
});

binderSelect.addEventListener("change", () => {
  currentPage = 1;
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
