import React, { useState } from 'react';
import { node, object, oneOfType, string } from 'prop-types';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import css from './ExpandableMenu.module.css';
import { FormattedMessage } from 'react-intl';


const ExpandableMenu = props => {
  const {
    className,
    menu,
    submenus,
    handleOnClick,
    ...rest
  } = props;

  const ExpandedIcon = props => {
    const classes = classNames(css.icon, props.className);
    // extra small arrow head (down)
    return (
      <svg className={classes} width="8" height="5" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 10-.471-.471L4 3.528l-2.43-2.43a.333.333 0 10-.471.471l2.665 2.667z"
          fill="#46523F"
          stroke="#46523F"
          fillRule="evenodd"
        />
      </svg>
    );
  };

  const classes = classNames(css.root, className);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandedState = () => {
    setIsExpanded(!isExpanded);
  }

  return (
    //onClick={handleExpandedState}>

    <div className={classes} onClick={() => handleOnClick(menu.key)}>

      <div className={css.titleWrapper}>
        <p className={css.menu}>{menu.label}</p>
        {/* <ExpandedIcon className={isExpanded ? css.iconArrowAnimation : null} /> */}
      </div>


      {/* {isExpanded && (
        <ul>
          <li key={menu.key} className={css.submenuAll} onClick={() => handleOnClick(menu.key)}>
            <FormattedMessage id="ExpandableMenu.all" values={{ category: menu.label }} />
          </li>
        </ul>
      )
      } */}

      {/* {isExpanded && (
        submenus.map((item, index) => (
          <ul>
            <li key={item.key} className={css.submenu} onClick={() => handleOnClick(item.parentKey, item.key)}>{item.label}</li>
          </ul>
        ))
      )} */}

    </div>
  );

};

ExpandableMenu.defaultProps = {
  className: null,
  menu: null,
  // submenus: null
};

ExpandableMenu.propTypes = {
  className: string,
  menu: oneOfType([string, object]),
  // submenus: propTypes.array
};

export default ExpandableMenu;
