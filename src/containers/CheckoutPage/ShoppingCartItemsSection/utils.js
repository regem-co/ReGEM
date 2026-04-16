import config from '../../../config';
import { findConfigForSelectFilter } from '../../../util/search';

export const findLabel = (primaryKey, secondaryKey) => {
  const optionsConfig = findConfigForSelectFilter(primaryKey, config.custom.filters);
  const options = optionsConfig.options ? optionsConfig.options : [];
  const foundItem = options.find(x => x.key === secondaryKey);
  return foundItem?.label || secondaryKey;
};

export const getImageUrl = imgObj => {
  return (
    imgObj?.attributes?.variants['listing-card-2x'] &&  // imgObj?.attributes?.variants['listing-card-4x'] &&
    imgObj?.attributes?.variants['listing-card-2x']?.url  //imgObj?.attributes?.variants['listing-card-4x']?.url
  );
};
