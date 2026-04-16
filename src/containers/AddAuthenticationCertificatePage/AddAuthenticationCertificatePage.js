import React, { useState, useEffect } from 'react';

import {
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
  Button,
} from '../../components';
import StaticPage from '../../containers/StaticPage/StaticPage';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import css from './AddAuthenticationCertificatePage.module.css';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import ControlledFilesUploadField from '../../components/ControlledFilesUploadField/ControlledFilesUploadField';
import { post } from '../../util/api';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

const AddAuthenticationCertificatePageComponent = props => {
  const { transactionId } = props?.params || {};
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddFileToTx = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    return post('/api/transaction-transition', {
      txId: transactionId,
      transition: 'transition/upload-authentication-certificate',
      params: {
        protectedData: {
          authenticationCertificateName: selectedFileName,
        },
      },
    })
      .then(resp => {
        setError(null);
        setSuccess(true);
        setLoading(false);
      })
      .catch(e => {
        setSuccess(false);
        setError('Woops! Something went wrong, please try again. ');
        setLoading(false);
      });
  };

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  return (
    <StaticPage
      title="Authentication certificate"
      schema={{
        '@context': 'http://schema.org',
        '@type': 'AddAuthenticationCertificatePage',
        description: 'Authentication certificate',
        name: 'Authentication certificate',
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer />
        </LayoutWrapperTopbar>

        <LayoutWrapperMain className={css.staticPageWrapper}>
          <center>
            {' '}
            <h1 className={css.title}>
              Add authentication certificate
              <br /> for {transactionId}
            </h1>
            <ControlledFilesUploadField
              fieldLabel={' '}
              className={css.dynamicField}
              callbackFunction={fileName => {
                setSelectedFileName(fileName);
              }}
            />
            {selectedFileName && (
              <Button
                inProgress={loading}
                className={css.actionButton}
                onClick={handleAddFileToTx}
                type={'button'}
              >
                Add file to transaction
              </Button>
            )}
            {success && <p className={css.success}>Transaction updated!</p>}
            {error && (
              <p className={css.error}>
                {error} <br /> P.S. Transaction needs to be in the reviewed state
              </p>
            )}
          </center>
        </LayoutWrapperMain>

        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </StaticPage>
  );
};

const AddAuthenticationCertificatePage = compose(withRouter)(
  AddAuthenticationCertificatePageComponent
);

export default AddAuthenticationCertificatePage;
