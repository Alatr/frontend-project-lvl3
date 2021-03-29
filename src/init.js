import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import initView from './view.js';
import resources from './locales';
import parseRss from './rssParser.js';

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

const normalizeRss = ({ title, description, posts }) => {
  const feedId = _.uniqueId();
  const normalizeFeed = { title, description, feedId };
  const normalizePosts = posts.map((post) => ({ ...post, postId: _.uniqueId(), feedId }));

  return { normalizeFeed, normalizePosts };
};

const addRss = (state) => {
  state.rssLoading.processState = 'loading';

  axios.get(addProxy(state.form.fields.url))
    .then((response) => {
      
      const xmldom = parseRss(response.data.contents);
      const { normalizeFeed: feed, normalizePosts: posts } = normalizeRss(xmldom);
      
      state.feeds = [...state.feeds, feed];
      state.posts = [...posts, ...state.posts];
      state.subscribedUrls = [...state.subscribedUrls, state.form.fields.url];
      
      state.rssLoading.errors = null;
      state.rssLoading.processState = 'successLoad';
      state.rssLoading.processState = 'idle';
    })

    .catch((error) => {
      if (error.isAxiosError && !error.response) {
        state.rssLoading.errors = 'network-error';
        state.rssLoading.loadingRssStatus = 'idle';
        state.rssLoading.loadingRssStatus = 'networkFiled';
        return;
      }
      if (error.message === 'invalidRSS') {
        state.rssLoading.errors = 'invalidRssError';
        state.rssLoading.processState = 'idle';
        state.rssLoading.processState = 'invalidRssFeed';
        return;
      }
      console.error(error);
      state.rssLoading.errors = 'unknown-error';
      state.rssLoading.processState = 'idle';
      state.rssLoading.processState = 'filed';
    });
};

const pullingDelay = 5000;

function subscribe(state) {
  const promises = Object.values(state.subscribedUrls).map((url) => axios.get(addProxy(url))
    .then((response) => ({ status: 'success', rss: parseRss(response.data.contents) }))
    .catch((error) => ({ status: 'error', error })));

  return Promise.all(promises)
    .then((response) => {
      const normalizePosts = response
        .filter(({ status }) => status === 'success')
        .flatMap(({ rss }) => normalizeRss(rss).normalizePosts);

      const newPosts = _.differenceBy(normalizePosts, state.posts, 'title');
      state.posts = [...newPosts, ...state.posts];
    })
    .then(() => {
      setTimeout(() => {
        subscribe(state);
      }, pullingDelay);
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
        modalInstance: new Modal(document.getElementById('modal'))
      },
    };

    const state = {
      rssLoading: {
        processState: 'idle',
        error: null,
      },

      feeds: [],
      posts: [],
      
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
      ui: {
        watchedPosts: new Set(),
      }
    };
    const watchedState = initView(elements, i18nextInstance, state);

    subscribe(watchedState);

    function isValidURL(url, subscribedUrls) {
      const schema = yup.string().url().notOneOf(subscribedUrls);
      try {
        schema.validateSync(url);
        return null;
      } catch (err) {
        return err.message;
      }
    }

    elements.form.addEventListener('submit', (event) => {
      event.preventDefault();
      watchedState.form.fields.url = new FormData(event.target).get('url');

      const validationError = isValidURL(watchedState.form.fields.url, watchedState.subscribedUrls);

      if (validationError) {
        watchedState.form.errors = null;

        watchedState.form.fields.url = null;
        watchedState.form.valid = false;
        watchedState.form.errors = validationError;
        watchedState.form.processState = 'error';
        return;
      }

      watchedState.form.valid = true;
      watchedState.form.errors = validationError;
      watchedState.form.processState = 'validUrl';

      addRss(watchedState);
    });

    elements.postsList.addEventListener('click', (event) => {
      event.preventDefault();

      if (event.target.closest('[data-bs-toggle="modal"]') !== null) {
        const id = +event.target.dataset.id;
        watchedState.modal.activePost = id;

        watchedState.ui.watchedPosts.add(id);
      }
    });

    elements.postModal.modal.addEventListener('hide.bs.modal', () => {
      watchedState.modal.activePost = null;
    });
  });
};
