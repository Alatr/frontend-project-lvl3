import _ from 'lodash';

export default (xml) => {
  const parser = new DOMParser();
  const newDocument = parser.parseFromString(xml, 'application/xml');
  const ID = _.uniqueId();
  const posts = [...newDocument.querySelectorAll('channel > item')].map((post) => ({
    feed: ID,
    postId: _.uniqueId(),
    title: post.querySelector('title').textContent,
    description: post.querySelector('description').textContent,
    link: post.querySelector('link').textContent,
  }));
  return {
    feed: {
      feedId: ID,
      title: newDocument.querySelector('channel > title').textContent,
      description: newDocument.querySelector('channel > description').textContent,
    },
    posts,
  };
};
