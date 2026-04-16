import React, {useState, useEffect} from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { InlineTextButton } from '../../components';
import { LINE_ITEM_NIGHT, LINE_ITEM_DAY } from '../../util/types';
import config from '../../config';

import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import FavoriteIcon from '@material-ui/icons/Favorite';
import css from './ListingPage.module.css';
const sharetribeSdk = require('sharetribe-flex-sdk');
const sdk = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID
});

const SectionHeading = props => {
  const {
    priceTitle,
    formattedPrice,
    richTitle,
    category,
    authorLink,
    showContactUser,
    onContactUser,
    listingIdObj
  } = props;
  const listingId = listingIdObj.uuid;
  const [isFavourite, setIsFavourite] = useState(false);
  const [favListingsArray, setFavListingsArray] = useState([]);

  useEffect(()=>{
    sdk.currentUser.show().then(res => {
      if(res.data.data.attributes.profile.privateData && res.data.data.attributes.profile.privateData.favListingsArray){ 
        setFavListingsArray(res.data.data.attributes.profile.privateData.favListingsArray)
        const listingsIdsArray = res.data.data.attributes.profile.privateData.favListingsArray;
        const isFavourite = listingsIdsArray.find(id => {
          return id === listingId
        });
          if(isFavourite){
            setIsFavourite(true)
          }
      }
    }).catch(e => console.log(e));
  }, []);

  const unitType = config.lineItemUnitType;
  const isNightly = unitType === LINE_ITEM_NIGHT;
  const isDaily = unitType === LINE_ITEM_DAY;

  const unitTranslationKey = isNightly
    ? 'ListingPage.perNight'
    : isDaily
    ? 'ListingPage.perDay'
    : 'ListingPage.perUnit';

  const addToFavourites = (action) => {
          if(action === 'add'){
            console.log([...favListingsArray, listingId])
           return sdk.currentUser.updateProfile({
            privateData: {
              favListingsArray: [...favListingsArray, listingId]
            }
            }).then(resp => {
              return setIsFavourite(true)
            }).catch(e => console.log(e))
          
          }else{
            const favListingsArrayCopy = [...favListingsArray];
    
            for( var i = 0; i < favListingsArrayCopy.length; i++){ 
            
                if ( favListingsArrayCopy[i] === listingId) { 
            
                  favListingsArrayCopy.splice(i, 1); 
                }
            
            }

            return sdk.currentUser.updateProfile({
              privateData: {
                favListingsArray: favListingsArrayCopy
              }
            }).then(resp => {
              return setIsFavourite(false)
            }).catch(e => console.log(e))
          
          }
  }


  return (
    <div className={css.sectionHeading}>
      {/* <div className={css.desktopPriceContainer}>
        <div className={css.desktopPriceValue} title={priceTitle}>
          {formattedPrice}
        </div>
        <div className={css.desktopPerUnit}>
          <FormattedMessage id={unitTranslationKey} />
        </div>
      </div> */}
      <div className={css.heading}>
        <div className={css.titleWrapper}>
        <h1 className={css.title}>{richTitle}</h1>
              <div className={css.favButtonWrapper}>
                {!isFavourite ? <FavoriteBorderIcon onClick={() => addToFavourites('add')} className={css.favButtonNotSelected}/>
                  :
                  <FavoriteIcon onClick={() => addToFavourites('remove')} className={css.favButtonSelected}/>
                }
              </div>
        </div>
        <div className={css.author}>
          {category}
          <FormattedMessage id="ListingPage.soldBy" values={{ name: authorLink }} />
          {showContactUser ? (
            <span className={css.contactWrapper}>
              <span className={css.separator}>•</span>
              <InlineTextButton
                rootClassName={css.contactLink}
                onClick={onContactUser}
                enforcePagePreloadFor="SignupPage"
              >
                <FormattedMessage id="ListingPage.contactUser" />
              </InlineTextButton>
            </span>
          ) : null}
        </div>
      </div>
          
    </div>
  );
};

export default SectionHeading;
