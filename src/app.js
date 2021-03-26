import * as yup from 'yup';
import axios from 'axios';
import addProxy from './proxy.js';
import { parseXmlToRss, isValidRSS, getXMLDOM } from './xml-to-rss-parser.js';

function isValidURL(url, subscribedUrls) {
  const schema = yup.string().url().notOneOf(subscribedUrls);
  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
}

export const addRssHandler = (state, instances) => (event) => {
  event.preventDefault();
  const watchedState = state;

  instances.yup.setLocale({
    string: {
      url: instances.i18next.t('errorMessages.url'),
    },
    mixed: {
      notOneOf: instances.i18next.t('errorMessages.alreadyExists'),
    },
  });

  const formData = new FormData(event.target);
  const validationError = isValidURL(formData.get('url'), watchedState.rss.subscribedUrls);
  if (validationError) {
    watchedState.form.errors = null;

    watchedState.form.valid = false;
    watchedState.form.errors = validationError;
    watchedState.form.processState = 'error';
    return;
  }

  watchedState.form.valid = true;
  watchedState.form.errors = validationError;
  watchedState.form.processState = 'validUrl';

  watchedState.network.processAddRssFeed = 'sanding';
  axios.get(addProxy(formData.get('url')))
    .then((response) => {
      watchedState.network.processAddRssFeed = 'filling';
      const xmldom = getXMLDOM(response.data.contents);

      // if (!isValidRSS(xmldom)) throw new Error('invalidRSS');

      watchedState.form.errors = null;
      watchedState.form.processState = 'filling';
      watchedState.form.processState = 'successAddFeed';

      const { feed, posts } = parseXmlToRss(xmldom);
      watchedState.rss.feedsList = [...watchedState.rss.feedsList, feed];
      watchedState.rss.postsList = [...posts, ...watchedState.rss.postsList];

      watchedState.rss.subscribedUrls = [...watchedState.rss.subscribedUrls, formData.get('url')];
    })

    .catch((error) => {
      if (!!error.isAxiosError && !error.response) {
        watchedState.network.processAddRssFeed = 'networkFiled';
        watchedState.network.processAddRssFeed = 'filling';
        return;
      }
      if (error.message === 'invalidRSS') {
        watchedState.form.errors = instances.i18next.t('errorMessages.invalidRss');
        watchedState.form.processState = 'filling';
        watchedState.form.processState = 'invalidRssFeed';
        return;
      }
      console.log(error);
      watchedState.form.processState = 'filed';
    });
};

export const readFeedHandler = (state) => (event) => {
  event.preventDefault();
  const watchedState = state;

  if (event.target.closest('[data-bs-toggle="modal"]') !== null) {
    const id = +event.target.dataset.id;
    watchedState.modal.showPost = id;
    if (!watchedState.rss.watchedPosts.includes(id)) {
      watchedState.rss.watchedPosts.push(id);
    }
  }
};
