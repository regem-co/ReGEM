import React, { useState, useEffect } from 'react';
import config from '../../config';
import { twitterPageURL } from '../../util/urlHelpers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ExternalLink,
  UserNav,
} from '../../components';
import Grid from '@material-ui/core/Grid';
import { createImageVariantConfig, util as sdkUtil } from '../../util/sdkLoader';
import css from './FavListingsPage.module.css';
import { ListingCard, PaginationLinks } from '../../components';
import StaticPage from '../StaticPage/StaticPage';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

const FavListingsPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);
  const [favListings, setFavListings] = useState([]);
  const [justFetchedCurrentUser, setJustFetchedCurrentUser] = useState(null);
  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);

    sdk.currentUser
      .show()
      .then(res => {
        setJustFetchedCurrentUser(res.data.data);
        const userPrivateData = res.data.data.attributes.profile.privateData;
        if (userPrivateData.favListingsArray) {
          const favListingsIdsArray = userPrivateData.favListingsArray;
          const {
            aspectWidth = 1,
            aspectHeight = 1,
            variantPrefix = 'listing-card',
          } = config.listing;
          const aspectRatio = aspectHeight / aspectWidth;

          const promisesArray = favListingsIdsArray.map(listingId => {
            return sdk.listings
              .show({
                id: listingId,
                include: ['author', 'images'],
                'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
                ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
                ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
                //  "imageVariant.my-variant": sdkUtil.objectQueryString({
                //    w: 320,
                //    h: 640,
                //    fit: 'scale'
                //  }),
              })
              .then(resp => {
                let rowListing = resp.data.data;

                const imagesArray = resp.data.included.filter(i => {
                  return i.type === 'image';
                });
                // const firstImageId = resp.data.data.relationships.images.data[0].id.uuid;

                const imagesOrder = resp.data.data?.attributes?.publicData?.imagesOrder;
                const firstImageId =
                  Array.isArray(imagesOrder) && imagesOrder?.length > 0
                    ? imagesOrder[0]?.id
                    : resp.data.data.relationships.images.data[0].id.uuid;

                const finalImagesArray = [
                  imagesArray.find(i => {
                    return i.id.uuid === firstImageId;
                  }),
                ];

                const usersArray = resp.data.included.filter(i => {
                  return i.type === 'user';
                });
                const firstUserId = resp.data.data.relationships.author.data.id.uuid;
                const finalAuthorObj = usersArray.find(i => {
                  return i.id.uuid === firstUserId;
                });

                rowListing.images = finalImagesArray;
                rowListing.author = finalAuthorObj;

                return rowListing;
              })
              .catch(error => console.log(error.stack));
          });

          Promise.all(promisesArray)
            .then(resp => {
              // console.log("3#")
              // console.log("array with all the closed dates that we just fetched from external source")
              // console.log(resp.flat())
              const flattenJustFetchedDatesArray = resp.flat();
              return setFavListings(flattenJustFetchedDatesArray);
            })
            .catch(error => {
              console.log(error.stack);
            });
        }
      })
      .catch(e => console.log(e));
  }, []);

  const panelMediumWidth = 50;
  const panelLargeWidth = 62.5;
  const cardRenderSizes = [
    '(max-width: 767px) 100vw',
    `(max-width: 1023px) ${panelMediumWidth}vw`,
    `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
    `${panelLargeWidth / 3}vw`,
  ].join(', ');

  return (
    <StaticPage
      title="Sell and Shop Fine Jewelry | ReGEM"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'FavListingsPage',
        description: 'Favorite',
        name: 'Favorite listings page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
          <UserNav selectedPageName="FavListingsPage" />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <h1 className={css.pageTitle}>Favorite listings</h1>

          <div className={css.contentWrapper}>
            {favListings.length === 0 ? (
              <p className={css.noListings}>You don't have any favorite listings</p>
            ) : (
              <div className={css.listingCards}>
                {favListings.map(l => {
                  return (
                    <ListingCard
                      className={css.listingCard}
                      key={l.id.uuid}
                      listing={l}
                      listingExpanded={l}
                      renderSizes={cardRenderSizes}
                      setActiveListing={() => console.log('')}
                      favListings={true}
                      justFetchedCurrentUser={justFetchedCurrentUser}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default FavListingsPage;
