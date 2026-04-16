import React from 'react';
import css from './YoutubeVideoSection.module.css';

const YoutubeVideoSection = props => {
  const { youtubeUrl } = props;

  if (!youtubeUrl) {
    return null;
  }

  const convertedYoutubeUrl = youtubeUrl
    .replace('https://www.youtube.com/', 'https://www.youtube.com/embed/')
    .replace('watch?v=', '');

  return (
    <iframe
      width="100%"
      height="315"
      style={{ marginBottom: '40px', borderRadius: '8px' }}
      src={convertedYoutubeUrl}
      title="My latest video"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  );
};

export default YoutubeVideoSection;
