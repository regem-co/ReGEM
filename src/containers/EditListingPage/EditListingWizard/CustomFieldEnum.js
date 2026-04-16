import React from 'react';
// Import shared components
import { FieldSelect } from '../../../components';
// Import modules from this directory
import css from './EditListingWizard.module.css';

const CustomFieldEnum = props => {
  const { name, id, options, label, placeholder, validate, schemaType, intl } = props;

  return options && schemaType === 'enum' ? (
    <FieldSelect
      className={css.detailsSelect}
      name={name}
      id={id}
      label={label}
      validate={validate}
    >
      <option disabled value="">
        {placeholder}
      </option>
      {options.map(c => (
        <option key={c.key} value={c.key}>
          {typeof c.label === 'string' ? c.label : intl.formatMessage({ id: c.label.props.id })}
        </option>
      ))}
    </FieldSelect>
  ) : null;
};

export default CustomFieldEnum;
