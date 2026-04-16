/**
 * This component wraps React-Router's Link by providing name-based routing.
 *
 * The `name` prop should match a route in the flattened
 * routeConfiguration passed in context by the RoutesProvider
 * component. The `params` props is the route params for the route
 * path of the given route name.
 *
 * The `to` prop is an object with the same shape as Link requires,
 * but without `pathname` that will be generated from the given route
 * name.
 *
 * Some additional props can be passed for the <a> element like
 * `className` and `style`.
 *
 * The component can also be given the `activeClassName` prop that
 * will be added to the element className if the current URL matches
 * the one in the generated pathname of the link.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter, useHistory } from 'react-router-dom';
import classNames from 'classnames';
import routeConfiguration from '../../routing/routeConfiguration';
import { pathByRouteName, findRouteByRouteName } from '../../util/routes';
import Modal from '../Modal/Modal';
import css from '../DeleteOrSaveDraftListingButton/DeleteOrSaveDraftListingButton.module.css';
import Button from '../Button/Button';

export const NamedLinkComponent = props => {
  const [modalOpen, setModalOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState('/');
  const history = useHistory();
  const { name, params, title } = props;
  const routes = routeConfiguration();

  const onOver = () => {
    const { component: Page } = findRouteByRouteName(name, routes);
    // Loadable Component has a "preload" function.
    if (Page.preload) {
      Page.preload();
    }
  };

  // Link props
  const { to, children } = props;
  const pathname = pathByRouteName(name, routes, params);
  const { match } = props;
  const active = match.url && match.url === pathname;

  // <a> element props
  const { className, style, activeClassName } = props;
  const aElemProps = {
    className: classNames(className, { [activeClassName]: active }),
    style,
    title,
  };

  useEffect(() => {
    const prevPath = sessionStorage.getItem('previousNav');
    setPreviousPath(prevPath);
  });

  const isEditListingPage = name === 'EditListingPage';

  const paths = [
    ['draft/details', 'draft/photos'],
    ['draft/photos', 'draft/details'],
    ['edit/details', 'edit/photos'],
    ['edit/photos', 'edit/details']
  ];

  const isPathMatched = paths.some(([prev, curr]) =>
    previousPath?.includes(prev) && pathname?.includes(curr)
  );

  if (isEditListingPage && isPathMatched) {
    return (
      <>
        <Link onMouseOver={onOver} onTouchStart={onOver} to={{ pathname, ...to }} {...aElemProps} onClick={(e) => {
          e.preventDefault(); // Prevent the default link navigation
          setModalOpen(true);
          if (typeof window !== 'undefined') {
            window.scrollBy(0, 200);
          }
        }}>
          {children}
        </Link>
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
          onManageDisableScrolling={() => { }}
        >
          <div className={css.modalContent}>
            <p>CLICK SAVE TO CONTINUE</p>
            <Button type="button" onClick={() => {
              sessionStorage.setItem('targetPath', pathname);
              setTimeout(() => {
                setModalOpen(false);
                history.push(pathname);
              }, 200);
            }}>
              SAVE
            </Button>
          </div>
        </Modal>
      </>
    );
  } else
    return (
      <Link onMouseOver={onOver} onTouchStart={onOver} to={{ pathname, ...to }} {...aElemProps} onClick={(e) => {
        const toUrl = to.search ? `${pathname}?${to.search}` : pathname;
        e.preventDefault(); // Prevent the default link navigation
        sessionStorage.setItem('targetPath', toUrl);
        setTimeout(() => {
          history.push(toUrl);
        }, 200);
      }}>
        {children}
      </Link>
    );
};

const { object, string, shape, any } = PropTypes;

NamedLinkComponent.defaultProps = {
  params: {},
  to: {},
  children: null,
  className: '',
  style: {},
  activeClassName: 'NamedLink_active',
  title: null,
  match: {},
};

// This ensures a nice display name in snapshots etc.
NamedLinkComponent.displayName = 'NamedLink';

NamedLinkComponent.propTypes = {
  // name of the route in routeConfiguration
  name: string.isRequired,
  // params object for the named route
  params: object,
  // Link component props
  to: shape({ search: string, hash: string, state: object }),
  children: any,

  // generic props for the underlying <a> element
  className: string,
  style: object,
  activeClassName: string,
  title: string,

  // from withRouter
  match: object,
};

const NamedLink = withRouter(NamedLinkComponent);
NamedLink.displayName = 'NamedLink';

export default NamedLink;
