export const getSubcategoryLabel = category => {
  if (!category) {
    return null;
  }
  if (category === 'body') {
    return 'Body Jewelry Type';
  }
  if (category === 'bracelets') {
    return 'Bracelet Type';
  }
  if (category === 'earrings') {
    return 'Earring Type';
  }
  if (category === 'mens') {
    return 'Men Jewelry Type';
  }
  if (category === 'necklaces') {
    return 'Necklace Type';
  }
  if (category === 'rings') {
    return 'Ring Type';
  }
};

export const filterSubcategoriesOptions = (category, options) => {
  if (!options || !category) {
    return [];
  }

  const newOptions = [...options];

  return newOptions.filter(o => o.category === category);
};

export const necklaceLengthOptions = [
  {
    key: '14to16Inches',
    label: '14-16 inches',
  },
  {
    key: '17to19Inches',
    label: '17-19 inches',
  },
  {
    key: '20to24Inches',
    label: '20-24 inches',
  },
  {
    key: '28to34Inches',
    label: '28-34 inches',
  },
  {
    key: '36to40Inches',
    label: '36-40 inches',
  },
];

export const claspTypesOptions = [
  {
    key: 'springRing',
    label: 'Spring Ring',
  },
  {
    key: 'lobsterClasp',
    label: 'Lobster Clasp',
  },
  {
    key: 'bayonet',
    label: 'Bayonet',
  },
  {
    key: 'openBox',
    label: 'Open Box',
  },
  {
    key: 'figure8Safety',
    label: 'Figure 8 Safety',
  },
  {
    key: 'toggle',
    label: 'Toggle',
  },
  {
    key: 'mystery',
    label: 'Mystery',
  },
  {
    key: 'magnetic',
    label: 'Magnetic',
  },
  {
    key: 'pearl',
    label: 'Pearl',
  },
];

export const braceletLengthOptions = [
  {
    key: '5to6Inches',
    label: '6 inches',
  },
  {
    key: '6to6Inches',
    label: '6.5 inches',
  },
  {
    key: '6to7Inches',
    label: '7 inches',
  },
  {
    key: '7to7Inches',
    label: '7.5 inches',
  },
  {
    key: '7to8Inches',
    label: '8 inches',
  },
  {
    key: '85Inches',
    label: '8.5 inches',
  },
];

export const styleOptions = [
  {
    key: 'women',
    label: 'woman',
  },
  {
    key: 'men',
    label: 'men',
  },
  {
    key: 'unisex',
    label: 'unisex',
  },
];

export const soldAsOptions = [
  {
    key: 'pair',
    label: 'pair',
  },
  {
    key: 'single',
    label: 'single',
  },
];
