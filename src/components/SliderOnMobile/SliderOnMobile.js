import React, { useState, useEffect } from 'react';
import css from './SliderOnMobile.module.css';
// import './swiper.css';

const SliderOnMobile = props => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { desktopContent, slidesForMobile, noPreview, showDots } = props;
  const [width, setWidth] = useState(typeof window !== 'undefined' && window.innerWidth);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      require('swiper/css');
      require('swiper/css/bundle');
      require('swiper/css/navigation');
      require('swiper/css/pagination');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const Swiper =
    typeof window !== 'undefined'
      ? require('swiper/react').Swiper
      : dynamic(() => import('swiper/react'), {
        ssr: false,
      });

  const SwiperSlide =
    typeof window !== 'undefined'
      ? require('swiper/react').SwiperSlide
      : dynamic(() => import('swiper/react'), {
        ssr: false,
      });

  const Navigation =
    typeof window !== 'undefined'
      ? require('swiper').Navigation
      : dynamic(() => import('swiper'), {
        ssr: false,
      });

  const Pagination =
    typeof window !== 'undefined'
      ? require('swiper').Pagination
      : dynamic(() => import('swiper'), {
        ssr: false,
      });

  const slidesToShow = noPreview ? 1 : 1.2;

  if (width > 768) {
    return desktopContent;
  } else {
    return (
      <Swiper
        modules={[Navigation, Pagination]}
        navigation={{
          nextEl: '.custom_next',
          prevEl: '.custom_prev',
        }}
        spaceBetween={10}
        slidesPerView={slidesToShow}
        onSwiper={swiper => { }}
        onSlideChange={() => { }}
        pagination={showDots}
      >
        {slidesForMobile.map((s, index) => {
          return <SwiperSlide key={index}>{s}</SwiperSlide>;
        })}
      </Swiper>
    );
  }
};

export default SliderOnMobile;
