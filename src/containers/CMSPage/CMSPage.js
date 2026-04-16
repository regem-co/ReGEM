import React, { useEffect } from 'react';
import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import PageBuilder from '../../containers/PageBuilder/PageBuilder';
import { GoogleTagManagerHandler } from '../../analytics/handlers';

const gtmHandler = new GoogleTagManagerHandler();

export const CMSPageComponent = props => {
  const { params, pageAssetsData, inProgress, error } = props;
  const pageId = params.pageId || props.pageId;

  useEffect(() => {
    const previousPath = sessionStorage.getItem('previousNav');
    const canonicalPath = location.pathname;
    gtmHandler.trackPageView(canonicalPath, previousPath);
  }, []);

  if (!inProgress && error?.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[pageId]?.data}
      inProgress={inProgress}
      schemaType="Article"
    />
  );
};

CMSPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const CMSPage = compose(
  withRouter,
  connect(mapStateToProps)
)(CMSPageComponent);

export default CMSPage;
