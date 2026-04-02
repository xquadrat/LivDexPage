const languageCodes = {
  Deutsch: "DE",
  Englisch: "EN",
  Japanisch: "JP",
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

const missingCardPlaceholderUrl = "assets/images/gonna-catch-them-all.svg";

// Sucht einen manuellen Bild-Override fuer eine Karte.
function getImageOverride(card) {
  return imageOverrides.find((override) => {
    return (
      String(override.pokedexNumber) === String(card.pokedexNumber) &&
      override.set === card.set &&
      override.cardNumber === card.cardNumber
    );
  });
}

// Erkennt Karten, die sehr wahrscheinlich zur japanischen Bildlogik gehoeren.
function isJapaneseLikeCard(card) {
  const language = String(card.language || "").trim();
  const setCode = String(card.set || "").trim();
  const cardName = String(card.cardName || "").trim();

  if (language.startsWith("Japanisch")) {
    return true;
  }

  if (/^s\d+[a-z]$/i.test(setCode) || /^sv\d+[a-z]$/i.test(setCode) || /^m\d+[a-z]$/i.test(setCode)) {
    return true;
  }

  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(cardName);
}

// Formatiert die Kartennummer passend fuer die Bild-URL.
function getFormattedCardNumber(card, languageCode) {
  const cardNumber = String(card.cardNumber || "").trim();

  if (cardNumber === "") {
    return "";
  }

  if (/^\d+$/.test(cardNumber)) {
    const normalizedNumber = String(Number(cardNumber));

    if (languageCode === "JP") {
      return normalizedNumber;
    }

    return normalizedNumber.padStart(3, "0");
  }

  if (/^[A-Z]+\d+$/i.test(cardNumber)) {
    const match = cardNumber.match(/^([A-Z]+)(\d+)$/i);

    if (match) {
      const prefix = match[1].toUpperCase();
      const numericPart = String(Number(match[2]));
      return `${prefix}${numericPart}`;
    }
  }

  return cardNumber;
}

// Formatiert den Set-Code passend fuer die Bild-URL.
function getFormattedSetCode(card, languageCode) {
  const setCode = String(card.set || "").trim();
  const cardNumber = String(card.cardNumber || "").trim();

  if (setCode === "") {
    return "";
  }

  if (languageCode === "JP") {
    if (/^s\d+[a-z]$/i.test(setCode)) {
      const numericPart = setCode.slice(1, -1);
      const suffix = setCode.slice(-1).toLowerCase();
      return `S${numericPart}${suffix}`;
    }

    if (/^sv\d+[a-z]$/i.test(setCode)) {
      return `SV${setCode.slice(2)}`;
    }

    return setCode.toUpperCase();
  }

  if (setCode.toUpperCase() === "SWSH") {
    return "SP";
  }

  if (setCode.toUpperCase() === "SCR" && /^GG\d+$/i.test(cardNumber)) {
    return "CRZ";
  }

  return setCode.toUpperCase();
}

// Baut eine Bild-URL fuer eine bestimmte Sprachversion.
function buildCardImageUrl(card, languageCode) {
  if (!card.set || !card.cardNumber) {
    return "";
  }

  const providerFolder = languageCode === "JP" ? "tpc" : "tpci";
  const formattedSetCode = getFormattedSetCode(card, languageCode);
  const formattedCardNumber = getFormattedCardNumber(card, languageCode);

  if (!formattedSetCode || !formattedCardNumber) {
    return "";
  }

  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/${providerFolder}/${formattedSetCode}/${formattedSetCode}_${formattedCardNumber}_R_${languageCode}_LG.png`;
}

// Gibt moegliche Bild-URLs in sinnvoller Reihenfolge zurueck.
function getCardImageCandidates(card) {
  const imageOverride = getImageOverride(card);

  if (imageOverride) {
    return [imageOverride.imageUrl];
  }

  if (!card.isOwned) {
    return [missingCardPlaceholderUrl];
  }

  const preferredLanguageCode = languageCodes[card.language] || "";
  const candidates = [];
  const shouldTryJapanese = isJapaneseLikeCard(card);

  if (shouldTryJapanese) {
    candidates.push(buildCardImageUrl(card, "JP"));
  }

  if (preferredLanguageCode && preferredLanguageCode !== "JP") {
    candidates.push(buildCardImageUrl(card, preferredLanguageCode));
  }

  candidates.push(buildCardImageUrl(card, "DE"));
  candidates.push(buildCardImageUrl(card, "EN"));

  return [...new Set(candidates)].filter((candidate) => candidate !== "");
}

// Baut die bevorzugte Bild-URL fuer eine Karte.
function getCardImageUrl(card) {
  const candidates = getCardImageCandidates(card);

  if (candidates.length === 0) {
    return "";
  }

  return candidates[0];
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
