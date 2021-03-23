import * as yup from 'yup';
import axios from 'axios';
import addProxy from './proxy.js';
import xmlParser from './xmlParser.js';

function isValid(url) {
  const schema = yup.string().url();
  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
}
function isValidRSS(xml) {
  const parser = new DOMParser();
  const newDocument = parser.parseFromString(xml, 'application/xml');
  return newDocument.querySelector('rss') !== null;
}

export const addRssHandler = (state, instances) => (event) => {
  event.preventDefault();
  const watchedState = state;

  instances.yup.setLocale({
    string: {
      url: instances.i18next.t('errorMessages.url'),
    },
  });

  const formData = new FormData(event.target);
  const validationError = isValid(formData.get('url'));
  if (validationError) {
    watchedState.form.valid = false;
    watchedState.form.errors = validationError;
    watchedState.form.processState = 'error';
    return;
  }

  watchedState.form.valid = true;
  watchedState.form.errors = validationError;
  watchedState.form.processState = 'validUrl';

  if (watchedState.rss.subscribedUrls.includes(formData.get('url'))) {
    watchedState.form.errors = null;
    watchedState.form.errors = instances.i18next.t('errorMessages.alreadyExists');
    watchedState.form.processState = 'filling';
    watchedState.form.processState = 'subscribeError';
    return;
  }

  watchedState.form.processState = 'sanding';
  axios.get(addProxy(formData.get('url')))
    .then((response) => {
      watchedState.form.processState = 'filling';
      if (!isValidRSS(response.data.contents)) throw new Error('invalidRSS');

      watchedState.form.errors = null;
      watchedState.form.processState = 'filling';
      watchedState.form.processState = 'successAddFeed';

      const { feed, posts } = xmlParser(response.data.contents);
      watchedState.rss.feedsList = [...watchedState.rss.feedsList, feed];
      watchedState.rss.postsList = [...posts, ...watchedState.rss.postsList];

      watchedState.rss.subscribedUrls = [...watchedState.rss.subscribedUrls, formData.get('url')];

      return new Promise((resolve) => {
        if (watchedState.rss.subscribedUrls.length === 1) resolve(watchedState.rss);
      });
    })

    .catch((error) => {
      if (!!error.isAxiosError && !error.response) {
        watchedState.form.processState = 'networkFiled';
        return;
      }
      if (error.message === 'invalidRSS') {
        watchedState.form.errors = instances.i18next.t('errorMessages.invalidRss');
        watchedState.form.processState = 'filling';
        watchedState.form.processState = 'invalidRssFeed';
        return;
      }
      watchedState.form.processState = 'filed';
    });
};

export const readFeedHandler = (state) => (event) => {
  event.preventDefault();
  const watchedState = state;

  console.log(event.target);
  if (event.target.closest('[data-bs-toggle="modal"]') !== null) {
    const id = +event.target.dataset.id;
    watchedState.modal.showPost = id;
    if (!watchedState.rss.watchedPosts.includes(id)) {
      watchedState.rss.watchedPosts.push(id);
    }
  }
};
