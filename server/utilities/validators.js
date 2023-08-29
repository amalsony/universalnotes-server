module.exports.validateGarmentInput = (name, brand, colors) => {
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

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};
