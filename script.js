const cardsContainer = document.getElementById("cardsContainer");

const languageCodes = {
  Deutsch: "DE",
  Englisch: "EN",
  Japanisch: "JA",
  Niederländisch: "NL",
  Französisch: "FR",
  Italienisch: "IT",
  Spanisch: "ES",
  Portugiesisch: "PT",
  Koreanisch: "KO",
  Chinesisch: "ZH",
  Russisch: "RU",
  Polnisch: "PL"
};

function getCardImageUrl(card) {
  const languageCode = languageCodes[card.language] || "EN";

  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${card.set}/${card.set}_${card.cardNumber}_R_${languageCode}_LG.png`;
}

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
    <img class="card-image" src="${imageUrl}" alt="${card.pokemonName}">
    <h3 class="card-title">${card.pokemonName}</h3>
    <p class="card-info"><strong>Kartenname:</strong> ${cardNameText}</p>
    <p class="card-info"><strong>Aktuelle Karte:</strong> ${currentCardText}</p>
    <p class="card-info"><strong>Zielkarte:</strong> ${targetCardText}</p>
    <p class="card-info"><strong>Besitzstatus:</strong> ${ownedText}</p>
  `;

  return cardElement;
}

function renderCards(cards) {
  cardsContainer.innerHTML = "";

  cards.forEach((card) => {
    const cardElement = createCardElement(card);
    cardsContainer.appendChild(cardElement);
  });
}

fetch("data/cards.json")
  .then((response) => response.json())
  .then((cards) => {
    renderCards(cards);
  });
