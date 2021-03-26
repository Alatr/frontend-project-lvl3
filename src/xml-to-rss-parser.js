import _ from 'lodash';

export const parseXmlToRss = (xml) => {
  const parser = new DOMParser().parseFromString(xml, 'application/xml');

  if (parser.querySelector('rss') === null) throw new Error('invalidRSS');

  const posts = [...xml.querySelectorAll('channel > item')].map((post) => ({
    title: post.querySelector('title').textContent,
    description: post.querySelector('description').textContent,
    link: post.querySelector('link').textContent,
  }));
  return {
    feed: {
      title: xml.querySelector('channel > title').textContent,
      description: xml.querySelector('channel > description').textContent,
      posts,
    },
  };
};

export const isValidRSS = (xmldom) => xmldom.querySelector('rss') !== null;

export const getXMLDOM = (xml) => {
  const ID = _.uniqueId();
  const posts = [...xmldom.querySelectorAll('channel > item')].map((post) => ({
    feed: ID,
    postId: _.uniqueId(),
    title: post.querySelector('title').textContent,
    description: post.querySelector('description').textContent,
    link: post.querySelector('link').textContent,
  }));
  return {
    feed: {
      feedId: ID,
      title: xmldom.querySelector('channel > title').textContent,
      description: xmldom.querySelector('channel > description').textContent,
      posts,
    },
  };

  return parser;
};
