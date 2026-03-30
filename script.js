const cardsContainer = document.getElementById("cardsContainer");
const cardsStatus = document.getElementById("cardsStatus");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");

const cardsPerPage = 9;
let currentPage = 1;
let allCards = [];
let currentMode = "normal";

const viewTypeSelect = document.getElementById("viewType");
const viewValueSelect = document.getElementById("viewValue");
const showMissingButton = document.getElementById("showMissingButton");

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

// Gibt alle fehlenden Karten zurueck.
function getMissingCards() {
  return allCards.filter((card) => {
    return card.isOwned === false;
  });
}

// Fuellt das zweite Auswahlfeld passend zum ausgewaehlten Bereich.
function updateViewValueOptions() {
  const viewType = viewTypeSelect.value;

  viewValueSelect.innerHTML = '<option value="">Bitte waehlen</option>';

  if (viewType === "generation") {
    for (let generation = 1; generation <= 9; generation += 1) {
      const option = document.createElement("option");
      option.value = generation;
      option.textContent = `Generation ${generation}`;
      viewValueSelect.appendChild(option);
    }
  }

  if (viewType === "binder") {
    for (let binder = 1; binder <= 3; binder += 1) {
      const option = document.createElement("option");
      option.value = binder;
      option.textContent = `Ordner ${binder}`;
      viewValueSelect.appendChild(option);
    }
  }
}

// Gibt die Kartenliste passend zur aktuellen Bereichsauswahl zurueck.
// Gibt die Kartenliste passend zur aktuellen Ansicht zurueck.
function getVisibleCards() {
  if (currentMode === "missing") {
    return getMissingCards();
  }

  const viewType = viewTypeSelect.value;
  const viewValue = Number(viewValueSelect.value);

  if (viewType === "all") {
    return allCards;
  }

  if (!viewValue) {
    return [];
  }

  return getCardsByView(viewType, viewValue);
}

// Baut die Bild-URL fuer eine Karte.
function getCardImageUrl(card) {
  if (!card.set || !card.cardNumber) {
    return "";
  }

  const languageCode = languageCodes[card.language] || "EN";

  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set}/${card.set}_${card.cardNumber}_R_${languageCode}_LG.png`;
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

  cardElement.innerHTML = `
    <div class="card-image-wrapper">
      <img class="card-image" src="${imageUrl}" alt="${card.pokemonName}">
      <div class="card-image-fallback">Kein Bild verfuegbar</div>
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

// Aktualisiert die Navigationsbuttons fuer die Kartenansicht.
// Aktualisiert die Navigationsbuttons fuer die Kartenansicht.
function updatePaginationButtons(cards) {
  if (currentMode === "missing") {
    previousButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  const maxPage = Math.ceil(cards.length / cardsPerPage);

  previousButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === maxPage || maxPage === 0;
}

// Zeigt Karten im Kartenbereich an.
// In der normalen Ansicht wird paginiert, in der Fehlend-Ansicht nicht.
function renderCards(cards) {
  cardsContainer.innerHTML = "";

  let cardsToRender = [];
  let statusText = "";

  if (currentMode === "missing") {
    cardsToRender = cards;
    statusText = `Fehlende Karten: ${cards.length}`;
  } else {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    cardsToRender = cards.slice(startIndex, endIndex);

    statusText = `Zeige ${startIndex + 1} bis ${startIndex + cardsToRender.length} von ${cards.length} Karten`;
  }

  cardsStatus.textContent = statusText;

  cardsToRender.forEach((card) => {
    const cardElement = createCardElement(card);
    cardsContainer.appendChild(cardElement);
  });

  updatePaginationButtons(cards);
}

fetch("data/cards.json")
  .then((response) => response.json())
  .then((cards) => {
    allCards = cards;
    updateViewValueOptions();
    renderCards(getVisibleCards());
});

viewTypeSelect.addEventListener("change", () => {
  currentMode = "normal";
  currentPage = 1;
  updateViewValueOptions();
  renderCards(getVisibleCards());
});

viewValueSelect.addEventListener("change", () => {
  currentMode = "normal";
  currentPage = 1;
  renderCards(getVisibleCards());
});

showMissingButton.addEventListener("click", () => {
  currentMode = "missing";
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
