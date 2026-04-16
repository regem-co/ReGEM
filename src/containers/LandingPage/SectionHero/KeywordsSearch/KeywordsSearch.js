import React, { useState } from 'react';
import { Button } from '../../../../components';
import routeConfiguration from '../../../../routing/routeConfiguration';
import { createResourceLocatorString } from '../../../../util/routes';
import css from './KeywordsSearch.module.css';

const KeywordsSearch = props => {
  const { history } = props;
  const [keywords, setKeywords] = useState('');

  const handleSearch = () => {
    const searchParams = {
      keywords: keywords,
    };
    history.push(createResourceLocatorString('SearchPage', routeConfiguration(), {}, searchParams));
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      handleSearch();
    }
  };

  return (
    <div className={css.wrapper}>
      <input
        className={css.searchInput}
        value={keywords}
        onChange={e => setKeywords(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find your gem now!"
      />
      <Button className={css.searchButton} onClick={handleSearch}>
        SHOP
      </Button>
    </div>
  );
};

export default KeywordsSearch;
