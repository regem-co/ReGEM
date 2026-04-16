import React from 'react';
import { NamedLink } from '../../../components';
import css from './SectionHero.module.css';
import { FormattedMessage } from 'react-intl';
import phoebeImage from './phoebe.png';


const SectionHero = () => {
  return (
    <div className={css.root}>
      <img src={phoebeImage} className={css.image} />

      <div className={css.textSection}>
        {/* <h2 className={css.mainTitle}> */}
          {/* <FormattedMessage id="Scosha.title" /> */}
          {/* SCOSHA */}
        {/* </h2> */}
        {/* <img src={scoshaLogo} className={css.image} /> */}

        <p className={css.mainTitle}>

          GEM FOR A CAUSE: PHOEBE GATES

        </p>

        <p className={css.text}>
          {/* <FormattedMessage id="Scosha.text2" /> */}
          Partnering with Phoebe Gates, founder of Phia, a leader in circular fashion - to present her preloved gems from her jewelry collection directly to you!
<br/><br/>
All proceeds from her jewelry box sale are being
donated to</p> <b style={{fontWeight: 'bolder'}}>Earth Justice.</b>
        

        
      </div>
    </div>
  );
};

export default SectionHero;
