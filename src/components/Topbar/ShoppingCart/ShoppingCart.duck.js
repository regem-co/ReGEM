import pick from 'lodash/pick';
import { currentUserShowSuccess } from '../../../ducks/user.duck';
import { storableError } from '../../../util/errors';
import { denormalisedResponseEntities } from '../../../util/data';

// ================ Action types ================ //

export const SET_INITIAL_VALUES = 'app/ShoppingCart/SET_INITIAL_VALUES';
export const SET_OPEN_MODAL = 'app/ShoppingCart/SET_OPEN_MODAL';
export const SET_CLOSE_MODAL = 'app/ShoppingCart/SET_CLOSE_MODAL';

export const FETCH_SHOPPING_CART_REQUEST = 'app/ShoppingCart/FETCH_SHOPPING_CART_REQUEST';
export const FETCH_SHOPPING_CART_SUCCESS = 'app/ShoppingCart/FETCH_SHOPPING_CART_SUCCESS';
export const FETCH_SHOPPING_CART_ERROR = 'app/ShoppingCart/FETCH_SHOPPING_CART_ERROR';

export const MERGE_CART_ITEM_REQUEST = 'app/ShoppingCart/MERGE_CART_ITEM_REQUEST';
export const MERGE_CART_ITEM_SUCCESS = 'app/ShoppingCart/MERGE_CART_ITEM_SUCCESS';
export const MERGE_CART_ITEM_ERROR = 'app/ShoppingCart/MERGE_CART_ITEM_ERROR';

export const DELETE_CART_ITEM_REQUEST = 'app/ShoppingCart/DELETE_CART_ITEM_REQUEST';
export const DELETE_CART_ITEM_SUCCESS = 'app/ShoppingCart/DELETE_CART_ITEM_SUCCESS';
export const DELETE_CART_ITEM_ERROR = 'app/ShoppingCart/DELETE_CART_ITEM_ERROR';

// ================ Reducer ================ //

const initialState = {
  isOpenModal: false,
  uploadInProgress: false,
  shoppingCart: [],
  fetchShoppingCartInProgress: false,
  fetchShoppingCartError: null,
  mergeCartItemInProgress: false,
  mergeCartItemProfileError: null,
  deleteCartItemInProgress: false,
  deleteCartItemProfileError: null,
};

const listingPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case SET_OPEN_MODAL:
      return { ...state, isOpenModal: true };
    case SET_CLOSE_MODAL:
      return { ...state, isOpenModal: false };

    case FETCH_SHOPPING_CART_REQUEST:
      return {
        ...state,
        fetchShoppingCartInProgress: true,
        fetchShoppingCartError: null,
      };
    case FETCH_SHOPPING_CART_SUCCESS:
      return {
        ...state,
        fetchShoppingCartInProgress: false,
        shoppingCart: payload,
      };
    case FETCH_SHOPPING_CART_ERROR:
      return {
        ...state,
        fetchShoppingCartError: payload,
      };

    case MERGE_CART_ITEM_REQUEST:
      return {
        ...state,
        mergeCartItemInProgress: true,
        mergeCartItemProfileError: null,
      };
    case MERGE_CART_ITEM_SUCCESS:
      return {
        ...state,
        mergeCartItemInProgress: false,
      };
    case MERGE_CART_ITEM_ERROR:
      return {
        ...state,
        mergeCartItemInProgress: false,
        mergeCartItemProfileError: payload,
      };

    case DELETE_CART_ITEM_REQUEST:
      return {
        ...state,
        deleteCartItemInProgress: true,
        deleteCartItemProfileError: null,
      };
    case DELETE_CART_ITEM_SUCCESS:
      return {
        ...state,
        deleteCartItemInProgress: false,
      };
    case DELETE_CART_ITEM_ERROR:
      return {
        ...state,
        deleteCartItemInProgress: false,
        deleteCartItemProfileError: payload,
      };

    default:
      return state;
  }
};

export default listingPageReducer;

// ================ Action creators ================ //

export const setInitialValues = initialValues => ({
  type: SET_INITIAL_VALUES,
  payload: pick(initialValues, Object.keys(initialState)),
});

export const setOpenModal = () => ({
  type: SET_OPEN_MODAL,
});

export const setCloseModal = () => ({
  type: SET_CLOSE_MODAL,
});

export const fetchShoppingCartRequest = payload => ({
  type: FETCH_SHOPPING_CART_REQUEST,
  payload,
});
export const fetchShoppingCartSuccess = payload => ({
  type: FETCH_SHOPPING_CART_SUCCESS,
  payload,
});
export const fetchShoppingCartError = error => ({
  type: FETCH_SHOPPING_CART_ERROR,
  payload: error,
  error: true,
});

export const mergeCartItemRequest = () => ({
  type: MERGE_CART_ITEM_REQUEST,
});
export const mergeCartItemSuccess = () => ({
  type: MERGE_CART_ITEM_SUCCESS,
});
export const mergeCartItemError = error => ({
  type: MERGE_CART_ITEM_ERROR,
  payload: error,
  error: true,
});

export const deleteCartItemRequest = () => ({
  type: DELETE_CART_ITEM_REQUEST,
});
export const deleteCartItemSuccess = () => ({
  type: DELETE_CART_ITEM_SUCCESS,
});
export const deleteCartItemError = error => ({
  type: DELETE_CART_ITEM_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const fetchShoppingCart = currentUserPayload => {
  return (dispatch, getState, sdk) => {
    dispatch(fetchShoppingCartRequest());

    if (!!currentUserPayload) {
      const shoppingCart =
        currentUserPayload?.attributes?.profile?.publicData?.shoppingCart?.map(item => {
          return {
            listing: JSON.parse(item.listing),
            checkoutValues: JSON.parse(item.checkoutValues),
          };
        }) || [];

      dispatch(fetchShoppingCartSuccess(shoppingCart));

      return shoppingCart;
    }

    // Ensure the user is authenticated before making the request
    const isAuthenticated = getState().Auth.isAuthenticated;

    if (isAuthenticated) {
      return sdk.currentUser
        .show()
        .then(response => {
          const entities = denormalisedResponseEntities(response);
          if (entities.length !== 1) {
            throw new Error('Expected a resource in the sdk.currentUser.show response');
          }
          const currentUser = entities[0];

          const shoppingCart =
            currentUser?.attributes?.profile?.publicData?.shoppingCart?.map(item => {
              return {
                listing: JSON.parse(item.listing),
                checkoutValues: JSON.parse(item.checkoutValues),
              };
            }) || [];

          dispatch(fetchShoppingCartSuccess(shoppingCart));

          return shoppingCart;
        })
        .catch(e => {
          // Catch unauthorized errors, but do not dispatch to state
          if (e.response && e.response.status === 401) {
            console.log("Unauthorized: User is not authenticated.");
            // Optionally, display a message or take action here
          } else {
            dispatch(fetchShoppingCartError(storableError(e)));
          }
        });
    } else {
      // If user is not authenticated, handle it by loading data from session storage (fallback)
      const shoppingCartNonLogin = JSON.parse(window.sessionStorage.getItem('shoppingCart'))?.map(
        item => {
          return {
            listing: JSON.parse(
              typeof item.listing === 'string' ? item.listing : JSON.stringify(item.listing)
            ),
            checkoutValues: JSON.parse(
              typeof item.checkoutValues === 'string'
                ? item.checkoutValues
                : JSON.stringify(item.checkoutValues)
            ),
          };
        }
      );

      dispatch(fetchShoppingCartSuccess(shoppingCartNonLogin));

      return shoppingCartNonLogin;
    }
  };
};


export const mergeCartItem = ({
  savedShoppingCartItems: savedShoppingCartItemsRaw,
  newShoppingCartItems,
}) => {
  return (dispatch, getState, sdk) => {
    dispatch(mergeCartItemRequest());
    const savedShoppingCartItems = [...savedShoppingCartItemsRaw];

    newShoppingCartItems.forEach(newItem => {
      const result = savedShoppingCartItems.find(
        savedItem => savedItem?.listing?.id?.uuid === newItem?.listing?.id?.uuid
      );
      if (result?.checkoutValues?.quantity) {
        result.checkoutValues.quantity += newItem?.checkoutValues?.quantity || 0;
      } else {
        savedShoppingCartItems.push(newItem);
      }
    });

    const stringifyUpdatedShoppingCart = savedShoppingCartItems.map(item => {
      return {
        listing: JSON.stringify(item.listing),
        checkoutValues: JSON.stringify(item.checkoutValues),
      };
    });

    const queryParams = {
      expand: true,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    return sdk.currentUser
      .updateProfile(
        {
          publicData: {
            shoppingCart: [...stringifyUpdatedShoppingCart],
          },
        },
        queryParams
      )
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
        }
        const currentUser = entities[0];

        // Update current user in state.user.currentUser through user.duck.js
        dispatch(currentUserShowSuccess(currentUser));
        dispatch(fetchShoppingCart(currentUser));
        window.sessionStorage.setItem('shoppingCart', JSON.stringify([]));
        dispatch(mergeCartItemSuccess());

        return true;
      })
      .catch(e => dispatch(mergeCartItemError(storableError(e))));
  };
};

export const deleteCartItem = ({ deletedId }) => {
  return (dispatch, getState, sdk) => {
    dispatch(deleteCartItemRequest());
    const currentUser = getState().user.currentUser;
    const currentShoppingCart = getState().ShoppingCart.shoppingCart;

    let newShoppingCart = [...currentShoppingCart];

    const indexOfRemovingItem = newShoppingCart.findIndex(item => {
      return item.listing.id.uuid === deletedId;
    });

    if (indexOfRemovingItem > -1) {
      newShoppingCart.splice(indexOfRemovingItem, 1); // 2nd parameter means remove one item only
    }

    const stringifyUpdatedShoppingCart = newShoppingCart.map(item => {
      return {
        listing: JSON.stringify(item.listing),
        checkoutValues: JSON.stringify(item.checkoutValues),
      };
    });

    const queryParams = {
      expand: true,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    };

    return sdk.currentUser
      .updateProfile(
        {
          publicData: {
            shoppingCart: [...stringifyUpdatedShoppingCart],
          },
        },
        queryParams
      )
      .then(response => {
        const entities = denormalisedResponseEntities(response);
        if (entities.length !== 1) {
          throw new Error('Expected a resource in the sdk.currentUser.updateProfile response');
        }
        const currentUser = entities[0];

        // Update current user in state.user.currentUser through user.duck.js
        dispatch(currentUserShowSuccess(currentUser));
        dispatch(fetchShoppingCart(currentUser));
        window.sessionStorage.setItem('shoppingCart', JSON.stringify([]));
        dispatch(deleteCartItemSuccess());

        return true;
      })
      .catch(e => dispatch(deleteCartItemError(storableError(e))));
  };
};
