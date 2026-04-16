import React, { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import css from './CustomMetalTypeCheckboxesGroup.module.css';
import { Field } from 'react-final-form';
import './checkbox.css';

const CustomMetalTypeCheckboxesGroup = props => {
  const { name, id, label, options, values } = props;

  const caratOptions = [
    { key: '14kRoseGold', label: '14K Solid Rose Gold' },
    { key: '14kWhiteGold', label: '14K Solid White Gold' },
    { key: '14kYellowGold', label: '14K Solid Yellow Gold' },
    { key: '18kRoseGold', label: '18K Solid Rose Gold' },
    { key: '18kWhiteGold', label: '18K Solid White Gold' },
    { key: '18kYellowGold', label: '18K Solid Yellow Gold' },
  ];

  const checkboxesField = ({ input: { onChange, value }, label, ...rest }) => {
    const simpleOptions = options.filter(o => !o.key.includes('14k') && !o.key.includes('18k'));
    const customOptions = [
      {
        key: 'RoseGold',
        label: 'Solid Rose Gold',
        type: 'composed',
        option14: '14kRoseGold',
        option18: '18kRoseGold',
      },
      {
        key: 'WhiteGold',
        label: 'Solid White Gold',
        type: 'composed',
        option14: '14kWhiteGold',
        option18: '18kWhiteGold',
      },
      {
        key: 'YellowGold',
        label: 'Solid Yellow Gold',
        type: 'composed',
        option14: '14kYellowGold',
        option18: '18kYellowGold',
      },
      ...simpleOptions,
    ];

    return (
      <div className={css.wrapper}>
        <p className={css.label}>{label}</p>
        <div className={css.checkboxesWrapper}>
          {customOptions.map(o => {
            const isComposed = o.type === 'composed';

            if (isComposed) {
              const is14Checked = Array.isArray(value) && value.find(v => v === o.option14);
              const is18Checked = Array.isArray(value) && value.find(v => v === o.option18);
              const isMainCheckboxChecked = is14Checked || is18Checked;

              const [isOpen, setIsOpen] = useState(isMainCheckboxChecked);

              return (
                <div className={css.composedCheckboxItem}>
                  <div className={css.mainCheckbox}>
                    <Checkbox
                      checked={isMainCheckboxChecked || isOpen}
                      onChange={() => {
                        setIsOpen(!isOpen);
                        if (isOpen) {
                          const initialValues = value || [];
                          const newValues = initialValues.filter(
                            v => v !== o.option14 && v !== o.option18
                          );
                          onChange(Array.from(new Set([...newValues])));
                        }
                      }}
                      inputProps={{}}
                    />
                    <div className={css.checkboxLabel}>{o.label}</div>
                  </div>
                  {(isMainCheckboxChecked || isOpen) && (
                    <div className={css.secondaryCheckboxes}>
                      <div className={css.secondaryCheckboxItem}>
                        <Checkbox
                          checked={is14Checked}
                          onChange={() => {
                            if (is14Checked) {
                              const newValues = value.filter(v => v !== o.option14);
                              onChange(Array.from(new Set([...newValues])));
                            } else {
                              const newValues = value || [];
                              newValues.push(o.option14);
                              onChange(Array.from(new Set([...newValues])));
                            }
                          }}
                          inputProps={{}}
                        />
                        <div className={css.secondaryCheckboxLabel}>{'14K'}</div>
                      </div>

                      <div className={css.secondaryCheckboxItem}>
                        <Checkbox
                          checked={is18Checked}
                          onChange={() => {
                            if (is18Checked) {
                              const newValues = value.filter(v => v !== o.option18);
                              onChange(Array.from(new Set([...newValues])));
                            } else {
                              const newValues = value || [];
                              newValues.push(o.option18);
                              onChange(Array.from(new Set([...newValues])));
                            }
                          }}
                          inputProps={{}}
                        />

                        <div className={css.secondaryCheckboxLabel}>{'18K'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              const isChecked = Array.isArray(value) && value.find(v => v === o.key);
              return (
                <div className={css.checkboxItem}>
                  <Checkbox
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        const newValues = value.filter(v => v !== o.key);
                        onChange(Array.from(new Set([...newValues])));
                      } else {
                        const newValues = value || [];
                        newValues.push(o.key);
                        onChange(Array.from(new Set([...newValues])));
                      }
                    }}
                    inputProps={{}}
                  />
                  <div className={css.checkboxLabel}>{o.label}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  return <Field id={id} name={name} label={label} component={checkboxesField} />;
};

export default CustomMetalTypeCheckboxesGroup;
