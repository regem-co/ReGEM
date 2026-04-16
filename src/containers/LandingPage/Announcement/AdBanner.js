import { useState, useEffect } from 'react';
import css from './AdBanner.module.css';

const Banner = ({ texts }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % texts.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [texts]);

  return (
    <div className={css.banner}>
      {texts.map((text, i) => (
        <div key={text} className={`${css.text} ${index === i ? css.visible : ''}`}>
          {text}
        </div>
      ))}
    </div>
  );
};

export default Banner;
