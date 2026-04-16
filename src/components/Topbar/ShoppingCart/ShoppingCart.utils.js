export const handleSaveCartItemsToProfile = ({
  onMergeCartItem,
  onWarnNotSameVendor,
  onSaveCompleted,
  newShoppingCartItems = [],
  savedShoppingCartItems: savedShoppingCartItemsRaw = [],
}) => {
  const savedShoppingCartItems = [...savedShoppingCartItemsRaw];

  const isFromSameVendor =
    savedShoppingCartItems.length === 0 ||
    newShoppingCartItems.find(item => {
      return item.listing.author.id.uuid === savedShoppingCartItems?.[0]?.listing?.author.id.uuid;
    });

  if (isFromSameVendor) {
    return onMergeCartItem({
      savedShoppingCartItems: savedShoppingCartItemsRaw,
      newShoppingCartItems,
    }).then(() => {
      if (onSaveCompleted) {
        onSaveCompleted();
      }
    });
  } else {
    onWarnNotSameVendor();
  }
};
