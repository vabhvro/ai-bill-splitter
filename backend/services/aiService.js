async function parseBillWithAI(ocrText) {

  return {
    items: [
      {
        name: "Sample Item",
        price: 100
      }
    ],

    total: 100,

    rawText: ocrText
  };
}

module.exports = {
  parseBillWithAI,
};