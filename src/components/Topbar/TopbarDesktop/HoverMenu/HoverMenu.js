import React, { useState } from 'react';
import config from '../../../../config';
import routeConfiguration from '../../../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../../../util/routes';
import { findOptionsForSelectFilter } from '../../../../util/search';
import css from './HoverMenu.module.css';

const HoverMenu = props => {
  const { history } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = findOptionsForSelectFilter('category', config.custom.filters);
  const sendToCategory = c => {
    history.push(
      createResourceLocatorString('SearchPage', routeConfiguration(), {}, { pub_category: c })
    );
    setShowMenu(false);
  };

  const subcategories = findOptionsForSelectFilter('subcategory', config.custom.filters);
  const filteredSubcategories =
    selectedCategory && subcategories.filter(s => s.category === selectedCategory?.key);
  const sendToSubcategory = s => {
    history.push(
      createResourceLocatorString(
        'SearchPage',
        routeConfiguration(),
        {},
        { pub_category: selectedCategory?.key, pub_subcategory: s }
      )
    );
    setShowMenu(false);
  };

  return (
    <div className={css.wrapper} onMouseLeave={() => setShowMenu(false)}>
      <div className={css.linksWrapper}>
        {categories.map(c => (
          <div
            className={css.hoverLink}
            onMouseEnter={() => {
              if (c?.key !== 'extras') {
                setShowMenu(false);
                return;
              }
              setShowMenu(true);
              setSelectedCategory(c);
            }}
            onClick={() => sendToCategory(c.key)}
            key={`${c.key}`}
          >
            {c?.label}
          </div>
        ))}
        {/* <div
          className={css.hoverLink}
          onClick={() =>
            history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, {}))
          }
        >
          DESIGNERS
        </div> */}
        <div
          className={css.hoverLink}
          onClick={() =>
            history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, {}))
          }
        >
          SHOP ALL
        </div>
      </div>
      {showMenu && ( // KEEP IT ONLY FOR EXTRAS, THE OTHERS DON'T SHOW DROPDOWN. FILTER by brand first si by sellere second
        <div className={css.subcategoryMenu} onMouseLeave={() => setShowMenu(false)}>
          <div className={css.subcategoryMenuLeft}>
            <p className={css.subcategoryMenuLeftLabel}>{selectedCategory?.label}</p>
          </div>
          <div className={css.subcategoryMenuRight}>
            {filteredSubcategories.map(s => {
              return (
                <span key={`${s.key}`} onClick={() => sendToSubcategory(s.key)}>
                  {s?.topbarLabel || s?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HoverMenu;
