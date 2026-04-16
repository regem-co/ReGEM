import { createElement, Fragment } from 'react';

const isLocalhost = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const renderMarkdown = (markdownText, components) => {
  let processor;
  if (isLocalhost()) {
    processor = () => {
      // Return a mock processor for local development
      return {
        processSync: () => {
          return {
            result: 'Markdown processing is disabled in local development.',
          };
        },
      };
    };
  } else {
    // cjs module
    const unified = require('unified');
    const remarkParse = require('remark-parse');
    const remark2rehype = require('remark-rehype');
    const rehypeSanitize = require('rehype-sanitize');
    const rehypeReact = require('rehype-react');

    processor = (components = {}) => {
      return unified()
        .use(remarkParse)
        .use(remark2rehype)
        .use(rehypeSanitize)
        .use(rehypeReact, {
          createElement,
          Fragment,
          components,
        });
    };
  }

  return processor(components).processSync(markdownText).result;
};

export default renderMarkdown;
