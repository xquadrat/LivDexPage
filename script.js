fetch("data/cards.json")
  .then((response) => response.json())
  .then((cards) => {
    console.log(cards);
  });