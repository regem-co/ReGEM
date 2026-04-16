import React, { useState } from 'react';
import config from '../../config';
import routeConfiguration from '../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../util/routes';
import { findOptionsForSelectFilter } from '../../util/search';
import ExpandableMenu from '../ExpandableMenu/ExpandableMenu';
import NamedLink from '../NamedLink/NamedLink';
import css from './ExpandableCategoriesMenu.module.css';
const ExpandableCategoriesMenu = props => {
  const { history } = props;

  const categories = findOptionsForSelectFilter('category', config.custom.filters);
  const subcategories = findOptionsForSelectFilter('subcategory', config.custom.filters);

  const sendToSubcategory = (categoryKey, subcategoryKey) => {
    if (true) {//subcategoryKey === 'undefined') {
      history.push(
        createResourceLocatorString(
          'SearchPage',
          routeConfiguration(),
          {},
          { pub_category: categoryKey }
        )
      );
    } else {
      history.push(
        createResourceLocatorString(
          'SearchPage',
          routeConfiguration(),
          {},
          { pub_category: categoryKey, pub_subcategory: subcategoryKey }
        )
      );
    }
  };

  return (
    <div>
      <p className={css.shopAllButton}>
        <NamedLink name="SearchPage">SHOP ALL</NamedLink>
      </p>

      {categories.map((item, index) => (
        <ExpandableMenu
          key={item.key}
          menu={item}
          submenus={subcategories
            .filter(s => s.category === item.key)
            .map(s => ({ parentKey: item.key, key: s.key, label: s.label }))}

          handleOnClick={sendToSubcategory}
          //onClick={() => sendToSubcategory(item.key)}
        />
      ))}
    </div>
  );
};

export default ExpandableCategoriesMenu;
