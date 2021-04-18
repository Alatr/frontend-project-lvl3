import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import 'bootstrap';
import initView from './view.js';
import resources from './locales';
import parseRss from './rssParser.js';

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

function getTypeError(error) {
  if (error.isAxiosError) return 'network-error';
  if (error.isParsingError) return 'invalid-error';
  console.error(error);
  return 'unknown-error';
}

const addRss = (state) => {
  state.rssLoading.status = 'loading';
  state.rssLoading.error = null;

  axios.get(addProxy(state.form.fields.url))
    .then((response) => {
      const { title, description, items } = parseRss(response.data.contents);
      const feedId = _.uniqueId();

      const feed = {
        title, description, feedId, urlFeed: state.form.fields.url,
      };
      const posts = items.map((post) => ({ ...post, postId: _.uniqueId(), feedId }));

      state.feeds = [...state.feeds, feed];
      state.posts = [...posts, ...state.posts];

      state.rssLoading.status = 'successLoad';
      state.rssLoading.status = 'idle';
    })

    .catch((error) => {
      state.rssLoading.error = getTypeError(error);
      state.rssLoading.status = 'idle';
      state.rssLoading.status = 'error';
    });
};

const pullingDelay = 5000;

function fetchNewPosts(state) {
  const promises = state.feeds.map(({ urlFeed, feedId }) => axios.get(addProxy(urlFeed))
    .then((response) => ({ feedId, status: 'success', rss: parseRss(response.data.contents) }))
    .catch((error) => ({ status: 'error', error })));

  return Promise.all(promises)
    .then((response) => {
      const posts = response
        .filter(({ status }) => status === 'success')
        .flatMap(({ rss, feedId }) => (
          rss.items.map((post) => ({ ...post, postId: _.uniqueId(), feedId }))
        ));

      const newPosts = _.differenceBy(posts, state.posts, 'title');
      state.posts = [...newPosts, ...state.posts];
    })
    .then(() => {
      setTimeout(() => {
        fetchNewPosts(state);
      }, pullingDelay);
    })
    .catch((error) => {
      console.error(error);
    });
}

export default () => {
  const elements = {
    form: document.querySelector('[data-rss-form]'),
    formInput: document.querySelector('[data-rss-form] [data-rss-input]'),
    submit: document.querySelector('[data-rss-form] [data-submit-button]'),
    feedsList: document.querySelector('[data-feeds-list]'),
    postsList: document.querySelector('[data-posts-list]'),
    feedback: document.querySelector('[data-feedback-block]'),
    postModal: document.getElementById('modal'),
  };

  const state = {
    rssLoading: {
      processState: 'idle',
      error: null,
    },

    feeds: [],
    posts: [],

    form: {
      processState: 'filling',
      fields: {
        url: null,
      },
      valid: true,
      error: null,
    },
    modal: {
      activePost: null,
    },
    ui: {
      watchedPosts: new Set(),
    },
  };
  const i18nextInstance = i18next.createInstance();

  return i18nextInstance.init({
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

    const watchedState = initView(elements, i18nextInstance, state);

    fetchNewPosts(watchedState);

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

      const validationError = (
        isValidURL(watchedState.form.fields.url, watchedState.feeds.map(({ urlFeed }) => urlFeed))
      );
      if (validationError) {
        watchedState.form.processState = 'filling';
        watchedState.form.valid = false;
        watchedState.form.error = validationError;
        watchedState.form.processState = 'error';
        return;
      }

      watchedState.form.valid = true;
      watchedState.form.error = validationError;
      watchedState.form.processState = 'validUrl';

      addRss(watchedState);
    });

    elements.postsList.addEventListener('click', (event) => {
      event.preventDefault();

      const button = event.target.closest('[data-bs-toggle="modal"]');

      if (button !== null) {
        const id = +button.dataset.id;
        watchedState.modal.activePost = id;

        watchedState.ui.watchedPosts.add(id);
      }
    });

    elements.postModal.addEventListener('hide.bs.modal', () => {
      watchedState.modal.activePost = null;
    });
  });
};
