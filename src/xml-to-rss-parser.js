export const parseRss = (xml) => {
  const rssDOM = new DOMParser().parseFromString(xml, 'application/xml');

  const parsererrorNS = new DOMParser().parseFromString('INVALID', 'application/xml').getElementsByTagName('parsererror')[0].namespaceURI;
  if (rssDOM.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0) {
    throw new Error('invalidRSS');
  }

  const posts = [...rssDOM.querySelectorAll('channel > item')].map((post) => ({
    title: post.querySelector('title').textContent,
    description: post.querySelector('description').textContent,
    link: post.querySelector('link').textContent,
  }));
  return {
    title: rssDOM.querySelector('channel > title').textContent,
    description: rssDOM.querySelector('channel > description').textContent,
    posts,
  };
};
