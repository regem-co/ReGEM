import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
export const ASSET_NAME = 'about';

export const loadData = (params, search) => dispatch => {
  const pageAsset = { about: `content/pages/${ASSET_NAME}.json` };
  return dispatch(fetchPageAssets(pageAsset, true));
};
