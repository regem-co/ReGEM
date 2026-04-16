const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
});

import { types as sdkTypes } from '../../util/sdkLoader';

const { UUID, Money } = sdkTypes;

async function imageUrlToFileObject(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
  const file = new File([blob], filename, { type: blob.type });
  return file;
}

export const handleCopyListing = async (listing) => {
  try {
    console.log("Original Listing:", listing);

    const currentListingImages = listing.images || [];
    const currentListingImagesUrls = currentListingImages.map(
      (img) => img?.attributes?.variants['listing-card-2x']?.url
    );

    const filesPromises = currentListingImagesUrls.map((i) =>
      imageUrlToFileObject(i)
    );
    const filesArray = await Promise.all(filesPromises);

    // Upload new images
    const newListingImagesArray = [];
    for (const file of filesArray) {
      try {
        const uploadedImage = await sdk.images.upload({ image: file }, { expand: true });
        newListingImagesArray.push(new UUID(uploadedImage.data.data.id.uuid));
      } catch (imageUploadError) {
        console.error("Error uploading image:", imageUploadError);
      }
    }

    const oldListingPublicData = listing.attributes.publicData || {};

    const oldListingPrice = listing.attributes.price
      ? new Money(listing.attributes.price.amount, listing.attributes.price.currency)
      : null;

    // Prepare the new listing data
    const newListingInfo = {
      title: listing.attributes.title,
      description: listing.attributes.description,
      publicData: {
        ...oldListingPublicData,
      },
      images: newListingImagesArray.length > 0 ? newListingImagesArray : undefined,
      price: oldListingPrice || undefined,
      availabilityPlan: listing.attributes.availabilityPlan || undefined,
    };
    //  Create a new listing in draft mode
    const newListing = await sdk.ownListings.createDraft(newListingInfo);
    const newListingId = newListing?.data?.data?.id?.uuid;
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error copying listing:", error);
  }
};

