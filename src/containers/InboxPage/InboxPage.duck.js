import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { TRANSITIONS } from '../../util/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import config from '../../config';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';

const sortedTransactions = txs =>
  reverse(
    sortBy(txs, tx => {
      return tx.attributes ? tx.attributes.lastTransitionedAt : null;
    })
  );

// ================ Action types ================ //

export const FETCH_ORDERS_OR_SALES_REQUEST = 'app/InboxPage/FETCH_ORDERS_OR_SALES_REQUEST';
export const FETCH_ORDERS_OR_SALES_SUCCESS = 'app/InboxPage/FETCH_ORDERS_OR_SALES_SUCCESS';
export const FETCH_ORDERS_OR_SALES_ERROR = 'app/InboxPage/FETCH_ORDERS_OR_SALES_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
  entities.map(entity => ({
    id: entity.id,
    type: entity.type,
  }));

const initialState = {
  fetchInProgress: false,
  fetchOrdersOrSalesError: null,
  pagination: null,
  transactionRefs: [],
};

export default function checkoutPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_ORDERS_OR_SALES_REQUEST:
      return { ...state, fetchInProgress: true, fetchOrdersOrSalesError: null };
    case FETCH_ORDERS_OR_SALES_SUCCESS: {
      const transactions = sortedTransactions(payload.data.data);
      return {
        ...state,
        fetchInProgress: false,
        transactionRefs: entityRefs(transactions),
        pagination: payload.data.meta,
      };
    }
    case FETCH_ORDERS_OR_SALES_ERROR:
      console.error(payload); // eslint-disable-line
      return { ...state, fetchInProgress: false, fetchOrdersOrSalesError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

const fetchOrdersOrSalesRequest = () => ({ type: FETCH_ORDERS_OR_SALES_REQUEST });
const fetchOrdersOrSalesSuccess = response => ({
  type: FETCH_ORDERS_OR_SALES_SUCCESS,
  payload: response,
});
const fetchOrdersOrSalesError = e => ({
  type: FETCH_ORDERS_OR_SALES_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

const INBOX_PAGE_SIZE = 12;

export const loadData = (params, search) => (dispatch, getState, sdk) => {
  const { tab } = params;

  const isOrders = tab === 'orders';
  const isSales = tab === 'sales';
  const isChats = tab === 'chats';

  const onlyFilterValues = {
    orders: 'order',
    sales: 'sale',
  };

  let onlyFilter = {};
  let transitions = [];

  if (isOrders) {
    onlyFilter = { only: 'order' };
    const excludedTransitions = new Set([
      'transition/cancel',
      'transition/enquire',
      'transition/cancel-from-disputed',
      'transition/auto-cancel',
      'transition/offer-expired',
    ]);
    transitions = TRANSITIONS.filter(t => !excludedTransitions.has(t));
  }

  if (isSales) {
    onlyFilter = { only: 'sale' };
    const excludedTransitions = new Set([
      'transition/cancel',
      'transition/cancel-from-disputed',
      'transition/auto-cancel',
    ]);
    transitions = TRANSITIONS.filter(t => !excludedTransitions.has(t));
  }

  if (isChats) {
    transitions = [
      'transition/enquire',
      'transition/offer-made-by-customer',
      'transition/offer-expired',
      
      'transition/offer-made-by-provider',
      'transition/counter-offer-made-by-customer',
      'transition/request-payment',
      'transition/request-payment-affirm',
      'transition/request-payment-after-enquiry',
      'transition/auto-cancel',
      'transition/cancel',
      'transition/cancel-from-disputed',
    ];
  }

  if (!onlyFilter) {
    return Promise.reject(new Error(`Invalid tab for InboxPage: ${tab}`));
  }

  dispatch(fetchOrdersOrSalesRequest());

  const { page = 1 } = parse(search);

  const getImageVariants = () => {
    const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
    const aspectRatio = aspectHeight / aspectWidth;
    return {
      'fields.image': [
        // Profile images
        'variants.square-small',
        'variants.square-small2x',

        // Listing images:
        `variants.${variantPrefix}`,
        `variants.${variantPrefix}-2x`,
      ],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    };
  };

  const apiQueryParams = {
    ...onlyFilter,
    lastTransitions: transitions,
    include: [
      'listing',
      'listing.images',
      'provider',
      'provider.profileImage',
      'customer',
      'customer.profileImage',
      'booking',
    ],
    'fields.transaction': [
      'lastTransition',
      'lastTransitionedAt',
      'transitions',
      'payinTotal',
      'payoutTotal',
      'lineItems',
    ],
    'fields.listing': ['title', 'publicData'], // Combine both fields in one array
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    ...getImageVariants(),
    // 'fields.image': ['variants.square-small', 'variants.square-small2x',],
    page,
  };

  return sdk.transactions
    .query(apiQueryParams)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchOrdersOrSalesSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(fetchOrdersOrSalesError(storableError(e)));
      throw e;
    });
};
