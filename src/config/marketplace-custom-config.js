/*
 * Marketplace specific configuration.
 *
 * Every filter needs to have following keys:
 * - id:     Unique id of the filter.
 * - label:  The default label of the filter.
 * - type:   String that represents one of the existing filter components:
 *           BookingDateRangeFilter, KeywordFilter, PriceFilter,
 *           SelectSingleFilter, SelectMultipleFilter.
 * - group:  Is this 'primary' or 'secondary' filter?
 *           Primary filters are visible on desktop layout by default.
 *           Secondary filters are behind "More filters" button.
 *           Read more from src/containers/SearchPage/README.md
 * - queryParamNames: Describes parameters to be used with queries
 *                    (e.g. 'price' or 'pub_amenities'). Most of these are
 *                    the same between webapp URLs and API query params.
 *                    You can't change 'dates', 'price', or 'keywords'
 *                    since those filters are fixed to a specific attribute.
 * - config: Extra configuration that the filter component needs.
 *
 * Note 1: Labels could be tied to translation file
 *         by importing FormattedMessage:
 *         <FormattedMessage id="some.translation.key.here" />
 *
 * Note 2: If you need to add new custom filter components,
 *         you need to take those into use in:
 *         src/containers/SearchPage/FilterComponent.js
 *
 * Note 3: If you just want to create more enum filters
 *         (i.e. SelectSingleFilter, SelectMultipleFilter),
 *         you can just add more configurations with those filter types
 *         and tie them with correct extended data key
 *         (i.e. pub_<key> or meta_<key>).
 */

import { FormattedMessage } from "react-intl";

export const filters = [
  {
    id: 'category',
    label: 'Category',
    type: 'SelectSingleFilter',
    group: 'primary',
    queryParamNames: ['pub_category'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'enum',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'necklaces', label: <FormattedMessage id="Filters.category.necklaces" /> },
        { key: 'bracelets', label: <FormattedMessage id="Filters.category.bracelets" /> },
        { key: 'earrings', label: <FormattedMessage id="Filters.category.earrings" /> },
        { key: 'rings', label: <FormattedMessage id="Filters.category.rings" /> },
        { key: 'extras', label: <FormattedMessage id="Filters.category.extras" /> },
        // { key: 'mens', label: 'Mens' },
      ],
    },
  },

  {
    id: 'metalType',
    label: 'Metal type',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_metalType'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'multi-enum',
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'roseGold', label: 'Rose Gold', caratInfo: true },
        { key: 'whiteGold', label: 'White Gold', caratInfo: true },
        { key: 'yellowGold', label: 'Yellow Gold', caratInfo: true },

        { key: 'platinum', label: 'Platinum' },
        { key: 'rhodium', label: 'Rhodium' },
        { key: 'sterlingSilver', label: 'Sterling Silver' },
        { key: 'other', label: 'Other' },
      ],
    },
  },

  // TODO duplicated
  {
    id: 'metal',
    label: 'Metal type',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_metal'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'multi-enum',
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'roseGold', label: 'Rose Gold', caratInfo: true },
        { key: 'whiteGold', label: 'White Gold', caratInfo: true },
        { key: 'yellowGold', label: 'Yellow Gold', caratInfo: true },
        { key: 'platinum', label: 'Platinum' },
        { key: 'rhodium', label: 'Rhodium' },
        { key: 'sterlingSilver', label: 'Sterling Silver' },
        { key: 'other', label: 'Other' },
      ],
    },
  },
  {
    id: 'gemstone',
    label: 'Gemstone',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_gemstone'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'multi-enum',
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'whiteDiamond', label: 'White Diamond' },
        { key: 'blackDiamond', label: 'Black Diamond' },
        { key: 'emerald', label: 'Emerald' },
        { key: 'ruby', label: 'Ruby' },
        { key: 'Sapphire', label: 'Sapphire' },
        { key: 'quartz', label: 'Quartz' },
        { key: 'tourmaline', label: 'Tourmaline' },
        { key: 'labradorite', label: 'Labradorite' },
        { key: 'moonstone', label: 'Moonstone' },
        { key: 'opal', label: 'Opal' },
        { key: 'garnet', label: 'Garnet' },
        { key: 'chrysoprase', label: 'Chrysoprase' },
        { key: 'turquoise', label: 'Turquoise' },
        { key: 'aquamarine', label: 'Aquamarine' },
        { key: 'topaz', label: 'Topaz' },
        { key: 'amethyst', label: 'Amethyst' },
        { key: 'citrine', label: 'Citrine' },
        { key: 'peridot', label: 'Peridot' },
        { key: 'tsavorite', label: 'Tsavorite' },
        { key: 'agate', label: 'Agate' },
        { key: 'malachite', label: 'Malachite' },
        { key: 'onyx', label: 'Onyx' },
        { key: 'lapis', label: 'Lapis' },
        { key: 'coral', label: 'Coral' },
        { key: 'other', label: 'Other' },
      ],
    },
  },
  {
    id: 'materials',
    label: 'Materials',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_materials'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'multi-enum',
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'enamel', label: 'Enamel' },
        { key: 'leather', label: 'Leather' },
        { key: 'pearl', label: 'Pearl' },
        { key: 'other', label: 'Other' },
      ],
    },
  },
  {
    id: 'subcategory',
    label: 'Subcategory',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_subcategory'],
    config: {
      // Schema type options: 'enum', 'multi-enum'
      // Both types can work so that user selects multiple values when filtering search results.
      // With "enum" the functionality will be OR-semantics (Nike OR Adidas OR Salomon)
      // With "multi-enum" it's possible to use both AND and OR semantics with searchMode config.
      schemaType: 'multi-enum',
      searchMode: 'has_any',
      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        //extras
        { key: 'handBodyChains', label: <FormattedMessage id="Filters.category.extras.subcategory.handBodyChains" />, category: 'extras' },
        { key: 'anklet', label: <FormattedMessage id="Filters.category.extras.subcategory.anklet" />, category: 'extras' },
        { key: 'charmsEnhancers', label: <FormattedMessage id="Filters.category.extras.subcategory.charmsEnhancers" />, category: 'extras' },
        { key: 'watch', label: <FormattedMessage id="Filters.category.extras.subcategory.watch" />, category: 'extras' },
        { key: 'other', label: <FormattedMessage id="Filters.category.extras.subcategory.other" />, category: 'extras' },
        //bracelets
        { key: 'chains', label: <FormattedMessage id="Filters.category.bracelets.subcategory.chains" />, category: 'bracelets' },
        { key: 'tennis', label: <FormattedMessage id="Filters.category.bracelets.subcategory.tennis" />, category: 'bracelets' },
        { key: 'banglesCuffs', label: <FormattedMessage id="Filters.category.bracelets.subcategory.banglesCuffs" />, category: 'bracelets' },
        { key: 'charmsDangles', label: <FormattedMessage id="Filters.category.bracelets.subcategory.charmsDangles" />, category: 'bracelets' },
        //earrings
        { key: 'hoopsHuggies', label: <FormattedMessage id="Filters.category.earrings.subcategory.hoopsHuggies" />, category: 'earrings' },
        { key: 'sttuds', label: <FormattedMessage id="Filters.category.earrings.subcategory.sttuds" />, category: 'earrings' },
        { key: 'dangleDrop', label: <FormattedMessage id="Filters.category.earrings.subcategory.dangleDrop" />, category: 'earrings' },
        { key: 'cuffsJacketsCrawlers', label: <FormattedMessage id="Filters.category.earrings.subcategory.cuffsJacketsCrawlers" />, category: 'earrings' },
        //mens
        { key: 'mensBracelets', label: <FormattedMessage id="Filters.category.mens.subcategory.mensBracelets" />, topbarLabel: 'bracelets', category: 'mens', },
        { key: 'mensNecklaces', label: <FormattedMessage id="Filters.category.mens.subcategory.mensNecklaces" />, topbarLabel: 'necklaces', category: 'mens', },
        { key: 'mensRings', label: <FormattedMessage id="Filters.category.mens.subcategory.mensRings" />, topbarLabel: 'rings', category: 'mens' },
        { key: 'mensEarrings', label: <FormattedMessage id="Filters.category.mens.subcategory.mensEarrings" />, topbarLabel: 'earrings', category: 'mens' },
        { key: 'mensPendants', label: <FormattedMessage id="Filters.category.mens.subcategory.mensPendants" />, topbarLabel: 'pendants', category: 'mens' },
        //necklaces
        { key: 'chains', label: <FormattedMessage id="Filters.category.necklaces.subcategory.chains" />, category: 'necklaces' },
        { key: 'charmsPendants', label: <FormattedMessage id="Filters.category.necklaces.subcategory.charmsPendants" />, category: 'necklaces' },
        { key: 'chockersCollars', label: <FormattedMessage id="Filters.category.necklaces.subcategory.chockersCollars" />, category: 'necklaces' },
        { key: 'lariats', label: <FormattedMessage id="Filters.category.necklaces.subcategory.lariats" />, category: '' },
        //rings
        { key: 'stackables', label: <FormattedMessage id="Filters.category.rings.subcategory.stackables" />, category: 'rings' },
        { key: 'signetCocktail', label: <FormattedMessage id="Filters.category.rings.subcategory.signetCocktail" />, category: 'rings' },
        { key: 'wedding', label: <FormattedMessage id="Filters.category.rings.subcategory.wedding" />, category: 'rings' },
      ],
    },
  },
  {
    id: 'ringSize',
    label: 'Ring size',
    type: 'SelectSingleFilter',
    group: 'primary',
    queryParamNames: ['pub_ringSize'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'enum',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: '3', label: '3' },
        { key: '3.5', label: '3.5' },
        { key: '4', label: '4' },
        { key: '4.5', label: '4.5' },
        { key: '5', label: '5' },
        { key: '5.5', label: '5.5' },
        { key: '6', label: '6' },
        { key: '6.5', label: '6.5' },
        { key: '7', label: '7' },
        { key: '7.5', label: '7.5' },
        { key: '8', label: '8' },
        { key: '8.5', label: '8.5' },
        { key: '9', label: '9' },
        { key: '9.5', label: '9.5' },
        { key: '10', label: '10' },
        { key: '10.5', label: '10.5' },
        { key: '11', label: '11' },
        { key: '11.5', label: '11.5' },
        { key: '12', label: '12' },
      ],
    },
  },

  {
    id: 'condition',
    label: 'Condition',
    type: 'SelectSingleFilter',
    group: 'primary',
    queryParamNames: ['pub_condition'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'enum',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: 'neverWorn', label: 'Never Worn' },
        { key: 'excellent', label: 'Excellent' },
        { key: 'good', label: 'Good' },
        { key: 'fair', label: 'Fair' },
      ],
    },
  },

  {
    id: 'price',
    label: 'Price',
    type: 'PriceFilter',
    group: 'primary',
    // Note: PriceFilter is fixed filter,
    // you can't change "queryParamNames: ['price'],"
    queryParamNames: ['price'],
    // Price filter configuration
    // Note: unlike most prices this is not handled in subunits
    config: {
      min: 0,
      max: 1000,
      step: 5,
    },
  },
  {
    id: 'keyword',
    label: 'Keyword',
    type: 'KeywordFilter',
    group: 'primary',
    // Note: KeywordFilter is fixed filter,
    // you can't change "queryParamNames: ['keywords'],"
    queryParamNames: ['keywords'],
    // NOTE: If you are ordering search results by distance
    // the keyword search can't be used at the same time.
    // You can turn on/off ordering by distance from config.js file.
    config: {},
  },
  {
    id: 'priceRanges',
    label: 'Price Ranges',
    type: 'SelectMultipleFilter',
    group: 'primary',
    queryParamNames: ['pub_priceRange'],
    config: {
      // Schema type is enum for SelectSingleFilter
      schemaType: 'multi-enum',
      searchMode: 'has_any',

      // "key" is the option you see in Flex Console.
      // "label" is set here for the UI only.
      // Note: label is not added through the translation files
      // to make filter customizations a bit easier.
      options: [
        { key: "0to500", label: "Under $500", min: 0, max: 500 },
        { key: "500to1000", label: "$500-$1000", min: 500, max: 1000 },
        { key: "1000to2500", label: "$1000-$2500", min: 1000, max: 2500 },
        { key: "over2500", label: "$2500+", min: 2500, max: 1000000000 },
      ],
    },
  },

  // Here is an example of multi-enum search filter.
  //
  // {
  //   id: 'amenities',
  //   label: 'Amenities',
  //   type: 'SelectMultipleFilter',
  //   group: 'secondary',
  //   queryParamNames: ['pub_amenities'],
  //   config: {
  //     // Schema type options: 'enum', 'multi-enum'
  //     // Both types can work so that user selects multiple values when filtering search results.
  //     // With "enum" the functionality will be OR-semantics (Nike OR Adidas OR Salomon)
  //     // With "multi-enum" it's possible to use both AND and OR semantics with searchMode config.
  //     schemaType: 'multi-enum',

  //     // Optional modes: 'has_all', 'has_any'
  //     // Note: this is relevant only for schema type 'multi-enum'
  //     // https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
  //     searchMode: 'has_all',

  //     // "key" is the option you see in Flex Console.
  //     // "label" is set here for this web app's UI only.
  //     // Note: label is not added through the translation files
  //     // to make filter customizations a bit easier.
  //     options: [
  //       { key: 'towels', label: 'Towels' },
  //       { key: 'bathroom', label: 'Bathroom' },
  //       { key: 'swimming_pool', label: 'Swimming pool' },
  //       { key: 'barbeque', label: 'Barbeque' },
  //     ],
  //   },
  // },
];

export const sortConfig = {
  // Enable/disable the sorting control in the SearchPage
  active: true,

  // Note: queryParamName 'sort' is fixed,
  // you can't change it since Flex API expects it to be named as 'sort'
  queryParamName: 'sort',

  // Internal key for the relevance option, see notes below.
  relevanceKey: 'relevance',

  // Relevance key is used with keywords filter.
  // Keywords filter also sorts results according to relevance.
  relevanceFilter: 'keywords',

  // Keyword filter is sorting the results by relevance.
  // If keyword filter is active, one might want to disable other sorting options
  // by adding 'keyword' to this list.
  conflictingFilters: [],

  options: [
    { key: 'createdAt', label: 'Newest' },
    { key: '-createdAt', label: 'Oldest' },
    { key: '-price', label: 'Lowest price' },
    { key: 'price', label: 'Highest price' },

    // The relevance is only used for keyword search, but the
    // parameter isn't sent to the Marketplace API. The key is purely
    // for handling the internal state of the sorting dropdown.
    { key: 'relevance', label: 'Relevance', longLabel: 'Relevance (Keyword search)' },
  ],
};

export const listing = {
  // These should be listing details from public data with schema type: enum
  // SectionDetailsMaybe component shows these on listing page.
  enumFieldDetails: ['size', 'brand', 'category'],
};
