import React from 'react';
import css from './Announcement.module.css';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import AdBanner from './AdBanner';
const announcementMessage = process.env.REACT_APP_ANNOUNCEMENT_MESSAGE;

const Announcement = props => {
  const { intl } = props;
  const [show, setShow] = useState(true);
  const announcementMessage = process.env.REACT_APP_ANNOUNCEMENT_MESSAGE;

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollTop = window.pageYOffset;
        if (scrollTop > 0) {
          setShow(false);
        } else {
          setShow(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const forthMessage =
    intl.formatMessage({ id: 'Topbar.announcement4' }) === 'Topbar.announcement4'
      ? []
      : [intl.formatMessage({ id: 'Topbar.announcement4' })];
  const adsTexts = [
    intl.formatMessage({ id: 'Topbar.announcement1' }),
    intl.formatMessage({ id: 'Topbar.announcement2' }),
    intl.formatMessage({ id: 'Topbar.announcement3' }),
    ...forthMessage,
  ];

  return show ? (
    <div className={css.wrapper}>
      <AdBanner texts={adsTexts} />
    </div>
  ) : null;
};

export default Announcement;
