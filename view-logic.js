// Ansichts- und Filterlogik

// Gibt alle fehlenden Karten zurueck.
function getMissingCards() {
  return allCards.filter((card) => {
    return card.isOwned === false;
  });
}

// Filtert Karten anhand eines Pokedex-Bereichs.
function filterCardsByRange(cards, start, end) {
  return cards.filter((card) => {
    return card.pokedexNumber >= start && card.pokedexNumber <= end;
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

// Leert das Suchfeld.
function clearSearchInput() {
  searchInput.value = "";
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
