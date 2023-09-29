module.exports.validateGarmentInput = (name, brand, colors, category) => {
  const errors = {};

  if (!name || name.trim() === "") {
    errors.name = "Name must not be empty";
  }

  if (!brand || brand.trim() === "") {
    errors.brand = "Brand must not be empty";
  }

  if (!colors || colors.length === 0) {
    errors.colors = "Colors must not be empty";
  }

  if (!category || category.trim() === "") {
    errors.category = "Category must not be empty";
  }

  if (
    category !== "top" &&
    category !== "bottom" &&
    category !== "full" &&
    category !== "coat"
  ) {
    errors.category = "Category must be top, bottom, full or coat";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};
