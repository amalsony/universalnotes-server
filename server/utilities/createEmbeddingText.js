const createEmbeddingText = (name, brand, colors) => {
  let colorsText;
  let colorsString = "";
  let colorsArray = [];

  // check if colors is a String or an array
  if (typeof colors === "string") {
    colorsArray = colors.split(",");
  } else if (typeof colors === "object") {
    colorsArray = colors;
  }

  if (colorsArray.length === 1) {
    colorsString = colorsArray[0];
  } else if (colorsArray.length === 2) {
    colorsString = `${colorsArray[0]} and ${colorsArray[1]}`;
  } else {
    colorsString = colorsArray.join(", ");
    const lastComma = colorsString.lastIndexOf(",");
    colorsString =
      colorsString.substring(0, lastComma) +
      ", and" +
      colorsString.substring(lastComma + 1);
  }
  colorsText = colorsString;

  const embeddingText = `${colorsText} ${name} by the brand ${brand}`;

  return embeddingText;
};

module.exports = createEmbeddingText;
