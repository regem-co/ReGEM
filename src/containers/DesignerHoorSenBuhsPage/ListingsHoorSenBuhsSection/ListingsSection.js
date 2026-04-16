import React, { useState, useEffect } from 'react';
import css from './ListingsSection.module.css';
import config from '../../../config';
import { createImageVariantConfig } from '../../../util/sdkLoader';
import { util as sdkUtil } from '../../../util/sdkLoader';
import { ListingCard, NamedLink } from '../../../components';

const isDev = process.env.REACT_APP_ENV === 'development';
const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function ListingsSection(props) {
  const { intl, title } = props;
  const [spotLightListings, setSpotlightListings] = useState([]);

  useEffect(() => {

    const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.listing;
    const aspectRatio = aspectHeight / aspectWidth;
    const weLoveFilter = isDev ? {} : { pub_weLove: 'true' };
    sdk.listings
      .query({
        minStock: 1,
        ...weLoveFilter,
        //pub_branded: 'branded',
        pub_brandName: 'Hoorsenbuhs',
        include: ['author', 'images', 'author.profileImage', 'profileImage'],
        'fields.listing': ['title', 'geolocation', 'price', 'publicData', 'description'],
        'fields.user': [
          'profile.displayName',
          'profile.abbreviatedName',
          'profile.publicData',
          'profileImage',
          'profile.profileImage',
        ],
        'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
        ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      })
      .then(res => {
        const listings = res.data.data;
        const images =
          res.data.included &&
          res.data.included.filter(i => {
            return i.type === 'image';
          });
        const users =
          res.data.included &&
          res.data.included.filter(i => {
            return i.type === 'user';
          });

        if (users && users.length > 0) {
          users.forEach(u => {
            const imageId = u.relationships.profileImage.data?.id.uuid;

            const luckyImage = images.find(i => {
              return i.id.uuid === imageId;
            });

            u.profileImage = luckyImage;
          });
        }

        if (listings && listings.length > 0) {
          listings.forEach(l => {
            const imagesOrder = l?.attributes?.publicData?.imagesOrder;
            const imageId =
              Array.isArray(imagesOrder) && imagesOrder?.length > 0
                ? imagesOrder[0]?.id
                : l.relationships.images.data[0]?.id.uuid;

            const authorId = l.relationships.author.data?.id.uuid;

            const luckyImage = images.find(i => {
              return i?.id.uuid === imageId;
            });

            const author = users.find(u => {
              return u?.id.uuid === authorId;
            });
            l.author = author;
            l.images = [luckyImage];
          });
        }

        const listingsLeftToPush = 12 - listings.length;
        let finalListings = [...listings];

        for (let i = 1; i <= listingsLeftToPush; i++) {
          finalListings.push(listings[getRandomInt(listings.length - 1)]);
        }

        const finalListingsFiltered = finalListings.filter(l => l && l.attributes);
        // setSpotlightListings(finalListingsFiltered);
        setSpotlightListings(listings);
      })
      .catch(e => console.log(e));
  }, []);

  // Panel width relative to the viewport
  const panelMediumWidth = 50;
  const panelLargeWidth = 62.5;
  const cardRenderSizes = [
    '(max-width: 767px) 100vw',
    `(max-width: 1023px) ${panelMediumWidth}vw`,
    `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
    `${panelLargeWidth / 3}vw`,
  ].join(', ');

  if (typeof window === 'undefined') {
    return null;
  }

  function getRows(arr) {
    let output = {};
    let temp = arr.slice(0, 8);
    while (temp.length < 8) {
      temp.push(arr[Math.floor(Math.random() * arr.length)]);
    }
    output.firstRow = temp.slice(0, 4);
    output.secondRow = temp.slice(4, 8);
    return output;
  }

  const rows = spotLightListings && spotLightListings.length > 0 && getRows(spotLightListings);

  return spotLightListings && spotLightListings.length > 0 ? (
    <div className={css.wrapper}>
      <div className={css.row}>
        {spotLightListings?.map(l => {
          return (
            <ListingCard
              className={css.listingCard}
              key={l.id.uuid}
              listing={l}
              renderSizes={cardRenderSizes}
              setActiveListing={() => { }}
            // hideStamp={true}
            />
          );
        })}
      </div>
      <br />
      <br />
    </div>
  ) : null;
}

export default ListingsSection;
