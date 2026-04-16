import React, { useState } from 'react';
import css from './CustomPaymentMethodSelector.module.css';
// icons
import card from './icons/card.svg';

import affirm from './icons/affirm.png';
import { getSelectedPm } from '../../utils';
import { FormattedMessage } from 'react-intl';

const CustomPaymentMethodSelector = () => {
  const [selected, setSelected] = useState(null);
  const paymentMethods = [
    {
      logo: card,
      label: 'Card',
      key: 'card',
    },
    {
      logo: affirm,
      label: 'Affirm',
      key: 'affirm',
    },
  ];

  const selectedPmFromSession = getSelectedPm();
  return (
    <div className={css.wrapper}>
      <p className={css.title}>
        <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentMethodsTabTitle" />
      </p>
      {paymentMethods.map((i, index) => {
        return (
          <div
            key={index}
            className={
              selected === i?.label || selectedPmFromSession === i?.key
                ? css.itemSelected
                : css.item
            }
            onClick={() => {
              setSelected(i?.label);
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('selectedPM', i?.key);
                window.location.reload();
              }
            }}
          >
            <img className={css.image} src={i?.logo} />
            <p className={css.label}>{i?.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CustomPaymentMethodSelector;
