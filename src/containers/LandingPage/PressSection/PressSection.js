import React from 'react';

import elleLogo from './images/elleLogo.png';
import inStyleLogo from './images/inStyleLogo.png';
import vogueLogo from './images/vogueLogo.png';
import whoWhatWearLogo from './images/whoWhatWearLogo.png';
import wwdLogo from './images/wwdLogo.png';

import css from './PressSection.module.css';
import SliderOnMobile from '../../../components/SliderOnMobile/SliderOnMobile';

const PressSection = props => {
  const logos = [
    { image: elleLogo, link: 'https://www.elle.ro/' },
    { image: inStyleLogo, link: 'https://www.instyle.com/' },
    { image: vogueLogo, link: 'https://www.vogue.com/' },
    { image: whoWhatWearLogo, link: 'https://www.whowhatwear.co.uk/' },
    { image: wwdLogo, link: 'https://wwd.com/' },
  ];
  return (
    <div className={css.wrapper}>
      <h2 className={css.title}>Featured In</h2>

      <SliderOnMobile
        desktopContent={
          <div className={css.logosWrapper}>
            {logos.map((l, index) => (
              // <a href={l.link} target="_blank" className={css.logo}>
              //   <img src={l.image} />
              // </a>

              <span className={css.logo} key={`${index}`}>
                <img src={l.image} />
              </span>
            ))}
          </div>
        }
        slidesForMobile={logos.map((l, index) => (
          // <a href={l.link} target="_blank" className={css.logo}>
          //   <img src={l.image} />
          // </a>

          <span className={css.logo} key={`${index}`}>
            <img src={l.image} />
          </span>
        ))}
        noPreview={true}
      />
    </div>
  );
};

export default PressSection;
