import React, { useEffect, useState } from 'react';
import config from '../../../config';
import { findConfigForSelectFilter } from '../../../util/search';
import css from './ListingInfoSection.module.css';
import { convertMultipleOptionsCheckboxesValues } from './utils';
import {
  claspTypesOptions,
  necklaceLengthOptions,
  soldAsOptions,
  styleOptions,
  braceletLengthOptions,
} from '../../../util/listing';

const ListingInfoSection = props => {
  const { publicData, listing } = props;
  const [tab, setTab] = useState('productInformation');

  if (!publicData) {
    return null;
  }

  let content = null;

  const materialsConfig = findConfigForSelectFilter('materials', config.custom.filters);
  const materials = materialsConfig.options ? materialsConfig.options : [];
  const materialsInfo =
    publicData?.materials?.length > 0 &&
    publicData?.materials?.map(m => {
      return materials.find(i => i.key === m);
    });

  //Product information
  const description = listing?.attributes?.description;
  const category = publicData?.category;
  const isBranded = publicData?.branded === 'branded' && publicData?.brandName;

  //Product details
  const metalTypeConfig = findConfigForSelectFilter('metalType', config.custom.filters);
  const metalTypes = metalTypeConfig.options ? metalTypeConfig.options : [];
  const finalMetalTypes = convertMultipleOptionsCheckboxesValues(metalTypes, publicData);

  const gemstoneConfig = findConfigForSelectFilter('gemstone', config.custom.filters);
  const gemstoneOptions = gemstoneConfig.options ? gemstoneConfig.options : [];
  const finalGemstoneOptions = convertMultipleOptionsCheckboxesValues(
    gemstoneOptions,
    publicData,
    'gemstone'
  );

  const conditionConfig = findConfigForSelectFilter('condition', config.custom.filters);
  const conditionTypes = conditionConfig.options ? conditionConfig.options : [];
  const conditionLabel = conditionTypes?.find(c => c?.key === publicData?.condition)?.label;

  const subCategory = publicData?.subcategory;
  const subcategoryConfig = findConfigForSelectFilter('subcategory', config.custom.filters);
  const subcategoryOptions = subcategoryConfig.options ? subcategoryConfig.options : [];
  const foundSubcategory = subcategoryOptions.find(
    s => s.key === (Array.isArray(subCategory) ? subCategory[0] : subCategory)
  );

  const estimatedRetailPrice = Number(publicData?.estimatedRetailPrice);

  let subCategoryLabel = null;
  if (foundSubcategory?.category === 'necklaces') {
    subCategoryLabel = 'Necklace Type';
  }
  if (foundSubcategory?.category === 'bracelets') {
    subCategoryLabel = 'Bracelet Type';
  }
  if (foundSubcategory?.category === 'earrings') {
    subCategoryLabel = 'Earrings Type';
  }
  if (foundSubcategory?.category === 'rings') {
    subCategoryLabel = 'Ring Type';
  }

  if (foundSubcategory?.category === 'body') {
    subCategoryLabel = 'Body Jewelry Type';
  }

  const claspTypeLabel =
    (category === 'necklaces' || category === 'bracelets') &&
    claspTypesOptions?.find(c => c?.key === publicData?.claspType)?.label;

  const style = publicData?.style;

  const styles = style?.map(s => styleOptions.find(x => x?.key === s)?.label);

  // specific info

  let specificInfoLabel = null;
  let specificInfoValue = null;
  if (category === 'necklaces' && publicData?.necklaceLength) {
    specificInfoLabel = 'Length';
    specificInfoValue = necklaceLengthOptions.find(o => o.key === publicData?.necklaceLength)
      ?.label;
  }

  if (category === 'bracelets' && publicData?.braceletLength) {
    specificInfoLabel = 'Length';
    specificInfoValue = braceletLengthOptions.find(o => o.key === publicData?.braceletLength)
      ?.label;
  }

  if (category === 'earrings' && publicData?.earings_SoldAs) {
    specificInfoLabel = 'Sold as';
    specificInfoValue = soldAsOptions.find(o => o.key === publicData?.earings_SoldAs)?.label;
  }

  if (category === 'rings' && publicData?.ringSize) {
    specificInfoLabel = 'Ring Size';

    const ringSizeConfig = findConfigForSelectFilter('ringSize', config.custom.filters);
    const ringSizes = ringSizeConfig.options ? ringSizeConfig.options : [];

    specificInfoValue = ringSizes.find(o => o.key === publicData?.ringSize)?.label;
  }

  switch (tab) {
    case 'productInformation':
      content = (
        <div className={css.content}>
          {/* {description && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Description</p>
              <p className={css.contentItemValue}>{description}</p>
            </div>
          )}

          {category && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Category</p>
              <p className={css.contentItemValue}>{category}</p>
            </div>
          )} */}

          {
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Brand</p>
              <p className={css.contentItemValue}>{isBranded ? isBranded : 'Unbranded'}</p>
            </div>
          }

          {finalMetalTypes?.length > 0 && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Metal</p>
              <ul className={css.contentItemList}>
                {finalMetalTypes?.map((x, index) => <li key={index}>{x?.label}</li>)}
              </ul>
            </div>
          )}

          {finalGemstoneOptions?.length > 0 && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Gemstone</p>
              <ul className={css.contentItemList}>
                {finalGemstoneOptions?.map((x, index) => <li key={index}>{x?.label}</li>)}
              </ul>
            </div>
          )}

          {materialsInfo?.length > 0 && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Materials</p>
              <ul className={css.contentItemList}>
                {materialsInfo?.map((x, index) =>
                (
                  <li key={index}>{x?.key === "other" ? publicData?.otherMaterialDetails : x?.label}</li>
                )
                )}
              </ul>
            </div>
          )}

          {
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Condition</p>
              <p className={css.contentItemValue}>
                {conditionLabel ? conditionLabel : 'Not provided'}
              </p>
            </div>
          }

          {subCategoryLabel && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>{subCategoryLabel}</p>

              {Array.isArray(subCategory) ? (
                <ul className={css.contentItemList}>
                  {subCategory?.map((x, index) => (
                    <li key={index}>{subcategoryOptions.find(y => y.key === x)?.label}</li>
                  ))}
                </ul>
              ) : (
                <p className={css.contentItemValue}>{foundSubcategory?.label}</p>
              )}
            </div>
          )}

          {specificInfoLabel && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>{specificInfoLabel}</p>
              <p className={css.contentItemValue}>
                {specificInfoValue ? specificInfoValue : 'Not provided'}
              </p>
            </div>
          )}

          {claspTypeLabel && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Clasp Type</p>
              <p className={css.contentItemValue}>
                {claspTypeLabel ? claspTypeLabel : 'Not provided'}
              </p>
            </div>
          )}

          {styles?.length > 0 && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Style</p>
              <div className={css.contentItemValue}>
                {<ul className={css.contentItemList}>{styles?.map((x, index) => <li key={index}>{x}</li>)}</ul>}
              </div>
            </div>
          )}

          {!!estimatedRetailPrice && (
            <div className={css.contentItem}>
              <p className={css.contentItemLabel}>Est. Retail</p>
              <p className={css.contentItemValue}>  ${estimatedRetailPrice.toLocaleString('en-US')}</p>
            </div>
          )}
        </div>
      );
      break;

    // case 'productDetails':
    //   content = (
    //     <div className={css.content}>

    //     </div>
    //   );
    //   break;
    default:
      content = null;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.switchBar}>
        <div
          onClick={() => setTab('productInformation')}
          className={tab === 'productInformation' ? css.tabLabelSelected : css.tabLabel}
        >
          Product information
        </div>
        {/* <div
          onClick={() => setTab('productDetails')}
          className={tab === 'productDetails' ? css.tabLabelSelected : css.tabLabel}
        >
          Product details
        </div> */}
        {/* <div
          onClick={() => setTab('reviews')}
          className={tab === 'reviews' ? css.tabLabelSelected : css.tabLabel}
        >
          Reviews
        </div> */}
        {/* <div
          onClick={() => setTab('returnsRefunds')}
          className={tab === 'returnsRefunds' ? css.tabLabelSelected : css.tabLabel}
        >
          Returns & Refunds
        </div> */}
      </div>
      {content}
    </div>
  );
};

export default ListingInfoSection;
