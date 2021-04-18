// https://stackoverflow.com/a/20294226/11264934 check invalid rss
const parsererrorNS = new DOMParser().parseFromString('INVALID', 'application/xml').getElementsByTagName('parsererror')[0].namespaceURI;

export default (xml) => {
  const rssDOM = new DOMParser().parseFromString(xml, 'application/xml');

  if (rssDOM.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0) {
    const parsingError = new Error('parsing-error');
    parsingError.isParsingError = true;
    throw parsingError;
  }

  const items = [...rssDOM.querySelectorAll('channel > item')].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));
  return {
    title: rssDOM.querySelector('channel > title').textContent,
    description: rssDOM.querySelector('channel > description').textContent,
    items,
  };
};
