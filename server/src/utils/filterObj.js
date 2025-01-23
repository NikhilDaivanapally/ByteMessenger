const filterObj = (obj, ...allowedFields) => {
  return Object.keys(obj).reduce((acc, val) => {
    if (allowedFields.includes(val)) {
      acc[val] = obj[val];
    }
    return acc;
  }, {});
};

export { filterObj };
