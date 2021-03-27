import i18next from 'i18next';
import axios from 'axios';
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import initView from './view.js';
import resources from './locales';
import { parseXmlToRss, normalizeRss } from './xml-to-rss-parser.js';

function isValidURL(url, subscribedUrls, yupInstance) {
  const schema = yupInstance.string().url().notOneOf(subscribedUrls);
  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
}

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

const addRss = (state, event, i18nextInstance, yupInstance) => {
  const watchedState = state;

  const formData = new FormData(event.target);
  const validationError = isValidURL(formData.get('url'), watchedState.subscribedUrls, yupInstance);
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

  watchedState.network.loadingRssStatus = 'sanding';
  axios.get(addProxy(formData.get('url')))
    .then((response) => {
      watchedState.network.loadingRssStatus = 'idle';

      const xmldom = parseXmlToRss(response.data.contents);
      const { normalizeFeed: feed, normalizePosts: posts } = normalizeRss(xmldom);

      watchedState.feedsList = [...watchedState.feedsList, feed];
      watchedState.postsList = [...posts, ...watchedState.postsList];
      watchedState.subscribedUrls = [...watchedState.subscribedUrls, formData.get('url')];

      watchedState.form.errors = null;
      watchedState.form.processState = 'filling';
      watchedState.form.processState = 'successAddFeed';
    })

    .catch((error) => {
      if (!!error.isAxiosError && !error.response) {
        watchedState.network.loadingRssStatus = 'networkFiled';
        watchedState.network.loadingRssStatus = 'idle';
        return;
      }
      if (error.message === 'invalidRSS') {
        watchedState.form.errors = i18nextInstance.t('errorMessages.invalidRss');
        watchedState.form.processState = 'filling';
        watchedState.form.processState = 'invalidRssFeed';
        return;
      }
      console.error(error);
      watchedState.form.processState = 'filed';
    });
};

function subscribe(rssState) {
  const state = rssState;
  const promises = Object.values(state.subscribedUrls).map((url) => axios.get(addProxy(url))
    .then((response) => ({ status: 'success', rss: parseXmlToRss(response.data.contents) }))
    .catch((error) => ({ status: 'error', error })));

  return Promise.all(promises)
    .then((response) => new Promise((resolve) => {
      const newPosts = response
        .filter(({ status }) => status === 'success')
        .flatMap(({ rss }) => normalizeRss(rss).normalizePosts)
        .filter(({ title }) => state.postsList.findIndex((post) => post.title === title) === -1);

      if (newPosts.length !== 0) {
        state.postsList = [...newPosts, ...state.postsList];
      }
      setTimeout(() => {
        resolve();
      }, 3000);
    }))
    .then(() => {
      subscribe(state);
    })
    .catch((error) => {
      throw new Error(error);
    });
}

export default () => {
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources,
  }, () => {
    yup.setLocale({
      string: {
        url: i18nextInstance.t('errorMessages.url'),
      },
      mixed: {
        notOneOf: i18nextInstance.t('errorMessages.alreadyExists'),
      },
    });

    const elements = {
      form: document.querySelector('[data-rss-form]'),
      formInput: document.querySelector('[data-rss-form] [data-rss-input]'),
      submitBtn: document.querySelector('[data-rss-form] [data-submit-button]'),
      formSubmitButton: document.querySelector('[data-rss-form] [data-rss-input]'),
      feedsList: document.querySelector('[data-feeds-list]'),
      postsList: document.querySelector('[data-posts-list]'),
      feedbackMessageBlock: document.querySelector('[data-feedback-block]'),
      postModal: {
        modal: document.getElementById('modal'),
        modalInstance: new Modal(document.getElementById('modal'), { backdrop: 'static' }),
        title: document.querySelector('[data-modal-title]'),
        description: document.querySelector('[data-modal-description]'),
        link: document.querySelector('[data-modal-link]'),
      },
    };

    const state = {
      network: {
        processAddRssFeed: 'filling',
      },

      feedsList: [],
      postsList: [],
      watchedPosts: new Set(),
      subscribedUrls: [],

      form: {
        processState: 'filling',
        processError: null,
        fields: {
          url: null,
        },
        valid: true,
        errors: null,
      },
      modal: {
        activePost: null,
      },
    };
    const watchedState = initView(elements, i18nextInstance, state);

    subscribe(watchedState);

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();

      addRss(watchedState, event, i18nextInstance, yup);
    });

    elements.postsList.addEventListener('click', (event) => {
      event.preventDefault();

      if (event.target.closest('[data-bs-toggle="modal"]') !== null) {
        const id = +event.target.dataset.id;
        watchedState.modal.activePost = id;

        watchedState.watchedPosts.add(id);
      }
    });

    elements.postModal.modal.addEventListener('hide.bs.modal', () => {
      watchedState.modal.activePost = null;
    });
  });
};
