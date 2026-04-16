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
  Button,
  NamedLink,
} from '../../components';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import StaticPage from '../../containers/StaticPage/StaticPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import { post } from '../../util/api';
import { createSlug } from '../../util/urlHelpers';
import {
  TRANSITION_REQUEST_PAYMENT_AFTER_ENQUIRY,
  txHasBeenReceived,
  txIsCanceled,
  txIsDelivered,
  txIsDisputed,
  txIsEnquired,
  txIsPaymentExpired,
  txIsPaymentPending,
  txIsPurchased,
  txIsReceived,
  txIsCompleted,
  txIsInFirstReviewBy,
  txIsOfferPending,
  txIsOfferAccepted,
} from '../../util/transaction';
import InfoIcon from '@mui/icons-material/Info';
import PanelHeading, {
  HEADING_ENQUIRED,
  HEADING_PAYMENT_PENDING,
  HEADING_PAYMENT_EXPIRED,
  HEADING_CANCELED,
  HEADING_PURCHASED,
  HEADING_DELIVERED,
  HEADING_DISPUTED,
  HEADING_RECEIVED,
  HEADING_OFFER_PENDING,
  HEADING_OFFER_ACCEPTED,
} from '../TransactionPage/TransactionPanel/PanelHeading';
import { Modal } from '../../components';
import css from './AdminPage.module.css';
// import InfoModal from './InfoModal';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { pushToPath } from '../../util/urlHelpers';
import dummyShippingLabel from '../../assets/utils/dummyShippingLabel.jpg';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const AdminPageComponent = props => {
  const { currentUser } = props;
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);
  const [introductionTransactions, setIntroductionTransactions] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [reload, setReload] = useState(false);
  const [focusedTransaction, setFocusedTransaction] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [tab, setTab] = useState('introductionTxs');

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
    // if (currentUser && currentUser?.attributes?.profile?.protectedData?.admin) {
    post('/api/query-all-tx', {})
      .then(resp => {
        //filter out payment txs
        //TODO show different ui for payment txs
        const paymentTxs = resp.filter(t => {
          const hasPayment = t.attributes.transitions.find(
            t => t.transition === 'transition/confirm-payment'
          );
          return hasPayment;
        });
        setPaymentTransactions(paymentTxs);
      })
      .catch(e => console.log(e));
    // } else {
    //   pushToPath('/');
    // }
  }, [reload]);

  // if (!currentUser?.attributes?.profile?.protectedData?.admin) {
  //   return null;
  // }

  const stateDataFn = tx => {
    if (txIsEnquired(tx)) {
      return {
        headingState: HEADING_ENQUIRED,
      };
    } else if (txIsOfferPending(tx)) {
      return {
        headingState: HEADING_OFFER_PENDING,
      };
    } else if (txIsOfferAccepted(tx)) {
      return {
        headingState: HEADING_OFFER_ACCEPTED,
      };
    } else if (txIsPaymentPending(tx)) {
      return {
        headingState: HEADING_PAYMENT_PENDING,
      };
    } else if (txIsPaymentExpired(tx)) {
      return {
        headingState: HEADING_PAYMENT_EXPIRED,
      };
    } else if (txIsPurchased(tx)) {
      return {
        headingState: 'Waiting for delivery',
      };
    } else if (txIsCanceled(tx)) {
      return {
        headingState: HEADING_CANCELED,
      };
    } else if (txIsDelivered(tx)) {
      return {
        headingState: HEADING_DELIVERED,
      };
    } else if (txIsDisputed(tx)) {
      return {
        headingState: HEADING_DISPUTED,
      };
    } else if (txIsReceived(tx) || txIsCompleted(tx)) {
      return {
        headingState: HEADING_RECEIVED,
      };
    } else if (txHasBeenReceived(tx)) {
      return {
        headingState: HEADING_RECEIVED,
      };
    } else {
      return { headingState: 'unknown' };
    }
  };

  const handleTransition = txId => {
    return post('/api/accept-by-operator', { txId })
      .then(resp => {
        setReload(!reload);
      })
      .catch(e => console.log(e));
  };

  const completeByOperator = (txId, transition) => {
    return post('/api/complete-by-operator', { txId, transition })
      .then(resp => {
        setReload(!reload);
      })
      .catch(e => console.log(e));
  };

  return (
    <StaticPage
      title="Admin"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AdminPage',
        description: 'Admin',
        name: 'Admin',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <center>
            <h2>Admin page</h2>
          </center>
          <center>
            <h3 style={{ marginBottom: '50px' }}>- Transactions -</h3>
          </center>

          <div className={css.contentWrapper}>
            <div className={css.row} style={{ fontWeight: '900' }}>
              <div className={css.rowSectionLeftShort}>Listing name</div>

              <div className={css.rowSectionRightLong}>
                <div className={css.rowSubsectionRightCenteredWide}>Tx id</div>

                <div className={css.rowSubsectionRightCentered}>Paid</div>

                <div className={css.rowSubsectionRightCentered}>Amount</div>

                <div className={css.rowSubsectionRight}>State</div>

                <div className={css.rowSubsectionRight}>Actions</div>
              </div>
            </div>

            {paymentTransactions.map(tx => {
              const listingName = tx?.listing?.attributes?.title;
              const txState = stateDataFn(tx);

              const isLastTransitionEnquire = txState?.isLastTransitionEnquire;

              const listingSlug = createSlug(tx.listing.attributes.title || '');
              const params = { slug: listingSlug, id: tx.listing.id.uuid };

              const protectedData = tx.attributes.protectedData;
              const paymentConfirmed = tx.attributes.transitions.find(
                t => t.transition === 'transition/confirm-payment'
              );

              const payinAmount = tx.attributes.payinTotal.amount;
              const payinAmountLabel = '$' + Number(payinAmount) / 100;
              const txCompleted = tx.attributes.transitions.find(
                t => t.transition === 'transition/complete-transaction-by-operator'
              );

              return (
                <div className={css.row}>
                  <div className={css.rowSectionLeftShort}>
                    <NamedLink name="ListingPage" params={params}>
                      {listingName}
                    </NamedLink>
                  </div>

                  <div className={css.rowSectionRightLong}>
                    <div className={css.rowSubsectionRightCenteredWide}>{tx.id.uuid}</div>

                    <div className={css.rowSubsectionRightCentered}>
                      {paymentConfirmed ? (
                        <CheckIcon className={css.checkIcon} />
                      ) : (
                        <ClearIcon className={css.clearIcon} />
                      )}
                    </div>

                    <div className={css.rowSubsectionRightCentered}>{payinAmountLabel}</div>

                    <div className={css.rowSubsectionRight}>
                      <div
                        className={css.txState}
                        style={{
                          color: txState?.headingState === 'Accepted' ? '#2ecc71' : 'orange',
                        }}
                      >
                        {txState?.headingState}
                      </div>
                    </div>

                    <div className={css.rowSubsectionRight}>
                      {/* <Button
                        disabled={txCompleted}
                        className={css.actionButton}
                        onClick={() =>
                          completeByOperator(
                            tx.id.uuid,
                            'transition/complete-transaction-by-operator'
                          )
                        }
                      >
                        Mark complete
                      </Button> */}

                      <a
                        className={css.getShippingLabelButton}
                        download="shipping-label.jpg"
                        target="_blank"
                        href={dummyShippingLabel}
                      >
                        Get shipping label
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return {
    currentUser,
  };
};

const AdminPage = compose(
  connect(mapStateToProps),
  injectIntl
)(AdminPageComponent);

export default AdminPage;
