const handleAwaitError = (req, res) => err => {
  res.status(500).json(err.message);
};

const createListing = async (req, res) => {
  const { integrationSdk, query, currentUser } = req;
  const { listingId } = query;

  const listingResponse = await integrationSdk.listings
    .show({
      id: listingId,
      include: ['author'],
    })
    .catch(handleAwaitError(req, res));
  const { data: listingData } = listingResponse.data;
  const { toggleMakeOffer, toggleShippingFee } = listingData?.attributes?.metadata || {};

  if (!!toggleMakeOffer && !!toggleShippingFee) {
    return res.json({ message: 'success' });
  }

  const { data: authorData = {} } = listingData?.relationships?.author;
  const { id: authorId } = authorData;
  const currentUserId = currentUser.id;

  if (authorId?.uuid !== currentUserId?.uuid) {
    return res.status(401).json({ message: 'Not authorize' });
  }

  await integrationSdk.listings
    .update({
      id: listingId,
      metadata: {
        toggleMakeOffer: 'on',
        toggleShippingFee: 'on',
        pocketListing: false,
      },
    })
    .catch(handleAwaitError(req, res));

  res.json({ message: 'success' });
};

const service = {
  createListing,
};

module.exports = service;
