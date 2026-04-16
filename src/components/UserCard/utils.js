import { types as sdkTypes } from '../../util/sdkLoader';
const { UUID } = sdkTypes;
const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});
export const getUserReviews = userId => {
  return sdk.reviews
    .query({
      subjectId: new UUID(userId),
    })
    .then(res => {
      const reviewsCount = res.data.data?.length;
      const totalRating = res.data.data?.reduce((acc, curr) => {
        return acc + (curr?.attributes?.rating || 0);
      }, 0);

      const avgRating = Number(Number(totalRating / reviewsCount).toFixed(1));
      return {
        reviewsCount,
        avgRating,
      };
    })
    .catch(e => {
      return {
        reviewsCount: 0,
        avgRating: 0,
      };
    });
};
