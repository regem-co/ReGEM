import React, { createContext, useState, useContext, useEffect } from "react";
import { createImageVariantConfig } from "../util/sdkLoader";
import config from "../config/config.js";
const sharetribeSdk = require("sharetribe-flex-sdk");

const ListingsContext = createContext();

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error("🚨 useListings must be used within a ListingsProvider");
  }
  return context;
};

export const ListingsProvider = ({ children }) => {
  const [spotlightListings, setSpotlightListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
    if (!clientId) {
      console.error("❌ Missing Sharetribe SDK Client ID");
      setError(new Error("Missing Sharetribe SDK Client ID"));
      setLoading(false);
      return;
    }

    let sdk;
    try {
      sdk = sharetribeSdk.createInstance({ clientId });
    } catch (error) {
      console.error("❌ Error initializing Sharetribe SDK:", error);
      setError(error);
      setLoading(false);
      return;
    }

    const listingConfig = config.listing || {};
    const {
      aspectWidth = 1,
      aspectHeight = 1,
      variantPrefix = "listing-card",
    } = listingConfig;
    const aspectRatio = aspectHeight / aspectWidth;

    const weLoveFilter =
      process.env.REACT_APP_ENV === "development" ? {} : { pub_weLove: "true" };

    // Fetch current user first
    sdk.currentUser
      .show()
      .then((userRes) => {
        const currentUser = userRes.data.data;
        if (!currentUser) {
          console.error("❌ No logged-in user found");
          setError(new Error("No logged-in user found"));
          setLoading(false);
          return;
        }

        const currentUserId = currentUser.id.uuid;

        // Fetch listings for the current user only
        return sdk.listings.query({
          authorId: currentUserId, // Filter listings by current user ID
           states: ["published", "closed", "draft", "pendingApproval"],
          minStock: 1,
          ...weLoveFilter,
          include: ["author", "images", "author.profileImage", "profileImage"],
          "fields.listing": ["title", "geolocation", "price", "publicData", "metadata", "description"],
          "fields.user": ["profile.displayName", "profile.abbreviatedName", "profile.publicData", "profileImage"],
          "fields.image": [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
          ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
          ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
        });
      })
      .then((res) => {
        if (!res) return; // Stop execution if user fetch failed

        console.log("✅ Listings Fetch Successful:", res.data);

        const listings = res.data.data || [];
        const images = res.data.included?.filter((i) => i.type === "image") || [];
        const users = res.data.included?.filter((i) => i.type === "user") || [];

        // Assign profile images to users
        users.forEach((user) => {
          const imageId = user.relationships?.profileImage?.data?.id?.uuid;
          if (imageId) {
            user.profileImage = images.find((img) => img.id.uuid === imageId) || null;
          }
        });

        // Assign images and authors to listings
        listings.forEach((listing) => {
          const imagesOrder = listing?.attributes?.publicData?.imagesOrder;

          // Get image IDs either from imagesOrder or from listing relationships
          const imageIds =
            Array.isArray(imagesOrder) && imagesOrder.length > 0
              ? imagesOrder.map((img) => img.id) // Extract IDs if imagesOrder exists
              : listing.relationships?.images?.data?.map((img) => img.id.uuid) || []; // Fallback to relationships.images

          const authorId = listing.relationships?.author?.data?.id?.uuid;
          listing.author = users.find((u) => u?.id?.uuid === authorId) || null;

          // Assign all related images
          listing.images = images.filter((img) => imageIds.includes(img?.id?.uuid));
        });

        setSpotlightListings(listings);
        setLoading(false);
      })
      .catch((e) => {
        console.error("❌ Listings Fetch Failed:", e);
        setError(e);
        setLoading(false);
      });
  }, []);

  return (
    <ListingsContext.Provider value={{ spotlightListings, loading, error }}>
      {children}
    </ListingsContext.Provider>
  );
};
