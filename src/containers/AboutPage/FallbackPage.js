import React from 'react';

import PageBuilder from '../PageBuilder/PageBuilder';

// NOTE: You could add the actual About here as a fallback
//       instead of showing this error message.
const fallbackAbout = `
# An error occurred
The web app couldn\'t reach the backend to fetch the About page.

## Possible actions
Please refresh the page and, if that doesn't help, contact the marketplace administrators.
`;

// Create fallback content (array of sections) in page asset format:
export const fallbackSections = {
  sections: [
    {
      sectionType: 'article',
      sectionId: 'about',
      appearance: { fieldType: 'customAppearance', backgroundColor: '#ffffff' },
      title: { fieldType: 'heading1', content: 'About' },
      blocks: [
        {
          blockType: 'defaultBlock',
          blockId: 'hero-content',
          text: {
            fieldType: 'markdown',
            content: fallbackAbout,
          },
        },
      ],
    },
  ],
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: 'About page',
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content: 'About fetch failed',
    },
  },
};

// This is the fallback page, in case there's no About asset defined in Console.
const FallbackPage = props => {
  return <PageBuilder pageAssetsData={fallbackSections} {...props} />;
};

export default FallbackPage;
