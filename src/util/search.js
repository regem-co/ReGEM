/**
 * SelectMultipleFilter needs to parse values from format
 * "has_all:a,b,c,d" or "a,b,c,d"
 */
export const parseSelectFilterOptions = uriComponentValue => {
  const startsWithHasAll = uriComponentValue && uriComponentValue.indexOf('has_all:') === 0;
  const startsWithHasAny = uriComponentValue && uriComponentValue.indexOf('has_any:') === 0;

  if (startsWithHasAll) {
    return uriComponentValue.substring(8).split(',');
  } else if (startsWithHasAny) {
    return uriComponentValue.substring(8).split(',');
  } else {
    return uriComponentValue.split(',');
  }
};

/**
 * Check if any of the filters (defined by filterIds) have currently active query parameter in URL.
 */
export const isAnyFilterActive = (filterIds, urlQueryParams, filterConfigs) => {
  const getQueryParamKeysOfGivenFilters = (keys, config) => {
    const isFilterIncluded = filterIds.includes(config.id);
    const addedQueryParamNamesMaybe = isFilterIncluded ? config.queryParamNames : [];
    return [...keys, ...addedQueryParamNamesMaybe];
  };
  const queryParamKeysOfGivenFilters = filterConfigs.reduce(getQueryParamKeysOfGivenFilters, []);

  const paramEntries = Object.entries(urlQueryParams);
  const activeKey = paramEntries.find(entry => {
    const [key, value] = entry;
    return queryParamKeysOfGivenFilters.includes(key) && value != null;
  });
  return !!activeKey;
};

/**
 * Check if the filter is currently active.
 */
export const findOptionsForSelectFilter = (filterId, filters) => {
  const filter = filters.find(f => f.id === filterId);
  return filter && filter.config && filter.config.options ? filter.config.options : [];
};

/**
 * Return filter config
 */
export const findConfigForSelectFilter = (filterId, filters) => {
  const filter = filters.find(f => f.id === filterId);
  return filter && filter.config ? filter.config : null;
};

/**
 * Check if the main search type is 'keywords'
 */
export const isMainSearchTypeKeywords = config => config.mainSearchType === 'keywords';

/**
 * Check if the origin parameter is currently active.
 */
export const isOriginInUse = config =>
  config.mainSearchType === 'location' && config.sortSearchByDistance;

/**
 * Check if the stock management is currently active.
 */
export const isStockInUse = config => config.listingManagementType === 'stock';

export const deepClone = obj => {
  // If it's not an array or an object, returns null
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  let cloned, i;

  // Handle: Date
  if (obj instanceof Date) {
    cloned = new Date(obj.getTime());
    return cloned;
  }

  // Handle: array
  if (obj instanceof Array) {
    let l;
    cloned = [];
    for (i = 0, l = obj.length; i < l; i++) {
      cloned[i] = deepClone(obj[i]);
    }

    return cloned;
  }

  // Handle: object
  cloned = {};
  for (i in obj)
    if (obj.hasOwnProperty(i)) {
      cloned[i] = deepClone(obj[i]);
    }

  return cloned;
};

export const filterFiltersOptions = (urlQueryParams, availableFilters) => {
  const selectedCategory = urlQueryParams.pub_category;

  let newFiltersOptions = deepClone(availableFilters);

  if (
    !selectedCategory ||
    (selectedCategory && selectedCategory !== 'mens' && selectedCategory !== 'rings')
  ) {
    newFiltersOptions = newFiltersOptions.filter(f => f.id !== 'ringSize');
  }

  if (!selectedCategory) {
    newFiltersOptions = newFiltersOptions.filter(f => f.id !== 'subcategory');
  } else {
    newFiltersOptions = newFiltersOptions.map(f => {
      if (f.id === 'subcategory') {
        const originalSubcategoryOptions = availableFilters.find(f => f.id === 'subcategory')
          ?.config.options;
        const newOptions = [...originalSubcategoryOptions];
        f.config.options = newOptions.filter(o => o.category === selectedCategory);
        return f;
      } else {
        return f;
      }
    });
  }

  return newFiltersOptions;
};
