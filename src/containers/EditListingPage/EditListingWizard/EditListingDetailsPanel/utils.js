import config from '../../../../config';
import { findConfigForSelectFilter } from '../../../../util/search';

export const filterJson = (json, str) => {
  const filtered = {};

  for (const key in json) {
    if (key.includes(str)) {
      filtered[key] = json[key];
    }
  }

  return filtered;
};

export const getAllValuesFromPublicData = (json, str) => {
  const filtered = {};

  for (const key in json) {
    filtered[key] = json[key];
  }

  return filtered;
};

export const independentValuesToMetalType = values => {
  if (!values) {
    return [];
  }
  const metalTypeConfig = findConfigForSelectFilter('metalType', config.custom.filters);
  const metalTypes = metalTypeConfig.options ? metalTypeConfig.options : [];

  const destructuredValues = Object.entries(values);
  const metalTypesKeys = metalTypes.map(m => m.key);
  const finalMetalTypesValue = metalTypesKeys.filter(k =>
    destructuredValues.find(v => v && v[0] === k && (Array.isArray(v[1]) ? v[1][0] : true))
  );

  return finalMetalTypesValue || [];
};
