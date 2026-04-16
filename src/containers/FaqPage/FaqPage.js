import React, { useEffect } from 'react';
import { scroller } from 'react-scroll';
import config from '../../config';
import { twitterPageURL } from '../../util/urlHelpers';
import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  ExternalLink,
} from '../../components';
import StaticPage from '../../containers/StaticPage/StaticPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import css from './FaqPage.module.css';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const FaqPage = () => {
  const { siteTwitterHandle, siteFacebookPage } = config;
  const siteTwitterPage = twitterPageURL(siteTwitterHandle);

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
    if (typeof window !== 'undefined') {
      // Get the hash tag from the URL
      const hash = window.location.hash;

      // If the hash tag is "sizes", scroll to the "sizes" section of the page
      if (hash === '#sizes') {
        scroller.scrollTo('sizes', {
          duration: 500,
          delay: 100,
          smooth: true,
          offset: -70, // Adjust as needed to account for fixed header
        });
      }
    }
  }, []);

  const questions = [
    {
      q: <h2 className={css.boldText}>Tips for a great listing?</h2>,
      a: (
        <>
          <h2>1. CRISP PHOTO OF ITEM: to help buyers quickly and clearly see the item</h2>

          <h2>2. PHOTO OF ITEM BEING WORN: to give the buyer an idea of how the item looks on</h2>

          <h2>
            3. PHOTO OF SUPPORTING DOCUMENTS: (if applicable) provide documents of authenticity for
            the item - such as a receipt, a jewelry certificate that provides verification of the
            metal materials and/or carat weight and clarity for any diamonds or gems used in the
            piece
          </h2>
        </>
      ),
    },

    {
      q: <h2 className={css.boldText}>Your item sold. Now what?</h2>,
      a: (
        <h2>
          When your items sells, ReGEM will immediately email you a FedEx shipping label addressed
          to our Quality Control HQ. You will have 3 business days to ship your item. You will need
          to print out the label and attach it to your own provided shipping box. Safely package
          your item into your box with any necessary soft bubble, tissue, or dust bag to prevent any
          damages. ReGEM is not responsible for any broken items during transportation from Sellers
          destination to our HQ. Once the item arrives to our quality control HQ, our experts will
          begin the inspection and authentication process, when the item passes, we will ship it to
          the seller and you will receive payment.
        </h2>
      ),
    },
    {
      q: (
        <h2 className={css.boldText} id="sizes">
          How does ReGEM authenticate?
        </h2>
      ),
      a: (
        <h2>
          We have our team of GIA certified gemologists and jewelry experts carefully inspect each
          item and verify that it matches the seller's item description. Our team will verify the
          precious metal materials, as well as the carat weight and clarity for any diamonds or gems
          used in the piece. Once the item passes our strict quality control and the item is
          verified, we will provide a certificate of authentication with each purchased item.
        </h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>What happens when a seller breaks the rules?</h2>,
      a: (
        <h2>
          Failure to complete a sale may result in a penalty fee equivalent to 15% of the
          transaction price. Your account can be subject to a penalty fee if you fail to ship the
          item within the allotted time period, typically 3 business days from date of the sale. Or
          if you sell and ship ReGEM the item and it doesn’t match the description in your listing,
          ReGEM has no obligation to return items that do not conform to the description provided by
          the Seller, or Seller will be charged the return shipping fee, if they’d like their item
          back. It is essential that you provide as much information as possible to avoid any issues
          down the road. If any discrepancies are found between the item’s listing and the piece
          itself during our checks, your sale could be delayed or cancelled, so be as descriptive
          and precise as possible.
        </h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>Does ReGEM offer resizing services?</h2>,
      a: <h2>YES!</h2>,
    },
    {
      q: (
        <h2 className={css.boldText}>Does ReGEM offer white-glove service for larger listings?</h2>
      ),
      a: (
        <h2>We currently offer white-glove concierge service in the Southern California region.</h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>What is the shipping policy?</h2>,
      a: (
        <h2>
          We ship all packages insured via FedEx ground shipping, to only addresses in the United
          States. Currently we do not offer international shipping.
        </h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>How do payouts work?</h2>,
      a: <h2>We will direct deposit into the bank account provided in your account settings.</h2>,
    },
    {
      q: <h2 className={css.boldText}>What can I sell on ReGEM?</h2>,
      a: (
        <h2>
          Our marketplace only accepts fine jewelry, which means the jewelry is made of precious
          metals, diamonds and gemstones. Precious metals can be solid or filled14K or higher gold,
          as well as platinum or sterling silver, and precious stones can be real diamonds and
          colored gemstones. We do not accept costume jewelry with imitation gemstones, gold or
          silver plated metal jewelry. We also specialize in unbranded jewelry pieces, but also
          accept branded items from luxury brands like Cartier to Tiffanys to fine jewelry designers
          like Anito Ko, Jacquie Aiche to Jennifer Meyer and more.
        </h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>What jewelry styles sell best on ReGEM?</h2>,

      a: (
        <h2>
          Fine fashion jewelry with contemporary styles that are current and on-trend, as well as
          unique vintage jewelry pieces.
        </h2>
      ),
    },
    {
      q: <h2 className={css.boldText}>What is your Refund Policy?</h2>,

      a: (
        <>
          <h2>
            Items purchased from individual sellers are not eligible for returns. What we do offer
            is a really simple alternative. Within 3 days of receiving your order, you can relist
            your item, free of charge, and keep 100% of your earnings from the sale.
          </h2>

          <h2>
            After 3 days, but within 14 days of receiving your order: relisting comes with a small
            processing fee - which is less than our usual selling fee.
          </h2>
        </>
      ),
    },
  ];

  return (
    <StaticPage
      title="FAQ"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'FaqPage',
        description: 'FAQ Refind',
        name: 'FAQ page',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <center>
            <h1>FAQs</h1>
          </center>

          {questions.map(q => (
            <Accordion
              sx={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                // marginBottom: '40px',
                // '& .MuiPaper-root': {
                //   background: 'red',
                // },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>{q.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{q.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

export default FaqPage;
