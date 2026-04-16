export const convertMultipleOptionsCheckboxesValues = (options, publicData, key) => {
  const foundOptions = [];

  options.forEach(el => {
    if (publicData[el.key] || (key && publicData[key]?.includes(el.key))) {
      let finalEl = { ...el };

      //find carat weight
      if (publicData[`${el.key}_carat`]) {
        finalEl.label += ` ${publicData[`${el.key}_carat`]}`;
      }

      if (
        key &&
        publicData[`${key}_${el.key}_weight`]
      ) {
        if (el.key === 'other')
          finalEl.label = `${publicData['otherGemstoneDetails']} ${publicData[`${key}_${el.key}_weight`] === 'unknown' ? '' : `(${publicData[`${key}_${el.key}_weight`]}${publicData[`${key}_${el.key}_weight`]?.includes('ctw') ? '' : ' ctw'})`}`;
        else
          finalEl.label += ` ${publicData[`${key}_${el.key}_weight`] === 'unknown' ? '' : `(${publicData[`${key}_${el.key}_weight`]}${publicData[`${key}_${el.key}_weight`]?.includes('ctw') ? '' : ' ctw'})`}`;
      }

      //find grams weight
      if (
        publicData[`metalType_${el.key}_weight`] &&
        publicData[`metalType_${el.key}_weight`] !== 'unknown'
      ) {
        finalEl.label += ` (${publicData[`metalType_${el.key}_weight`]}${publicData[`metalType_${el.key}_weight`]?.includes('gm') ? '' : ' gm'
          })`;
      }

      //if it's other metal
      if (el.key === 'other' && publicData.otherMetalDetails) {
        finalEl.label += ` (${publicData.otherMetalDetails})`;
      }

      foundOptions.push(finalEl);
    }
  });

  return foundOptions;
};
