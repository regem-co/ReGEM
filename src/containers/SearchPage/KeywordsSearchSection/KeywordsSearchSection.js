import React, { useEffect, useState } from 'react';
import routeConfiguration from '../../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../../util/routes';
import css from './KeywordsSearchSection.module.css';

const KeywordsSearchSection = props => {
  const { currentQueryParams, history } = props;

  const handleFiltersChange = newValues => {
    const newParams = {
      ...currentQueryParams,
      ...newValues,
    };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, newParams));
  };

  const [keywords, setKeywords] = useState(currentQueryParams?.keywords);

  const keywordsEmpty = !keywords || keywords === '';

  const handleSubmit = () => {
    const newValue = {
      keywords: keywordsEmpty ? null : keywords,
    };
    handleFiltersChange(newValue);
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      handleSubmit();
    }
  };

  return (
    <div className={css.wrapper}>
      <input
        className={css.searchInput}
        placeholder={'Type any keyword'}
        value={keywords}
        onChange={e => setKeywords(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className={css.searchButton} onClick={handleSubmit}>
        Search
      </div>
    </div>
  );
};

export default KeywordsSearchSection;
