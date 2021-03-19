import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import { Modal } from 'bootstrap';
import initView from './view.js';

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
const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;

const parseXML = (xml) => {
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

function subscribe(rssState) {
  const state = rssState;
  const promises = Object.values(state.subscribedUrls).map((url) => axios.get(addProxy(url))
    .then((response) => ({ status: 'success', xml: response.data.contents }))
    .catch((error) => ({ status: 'error', error })));

  return Promise.all(promises)
    .then((response) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(response);
      }, 3000);
    }))
    .then((response) => {
      const newPosts = response
        .filter(({ status }) => status === 'success')
        .flatMap(({ xml }) => parseXML(xml).posts)
        .filter(({ title }) => state.postsList.findIndex((post) => post.title === title) === -1);

      if (newPosts.length !== 0) {
        state.postsList = [...newPosts, ...state.postsList];
      }
      subscribe(state);
    })
    .catch((error) => {
      throw new Error(error);
    });
}

export default () => {
  // i18next.init({
  //   lng: 'ru',
  //   debug: true,
  //   resources,
  // })
  // .then(() => {
  // console.log(i18InArg.t('errorMessages.url'), r);
  yup.setLocale({
    string: {
      url: i18next.t('errorMessages.url'),
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
      instanse: new Modal(document.getElementById('modal'), { backdrop: 'static' }),
      closedElements: [...document.querySelectorAll('[data-bs-dismiss="modal"]')],
      title: document.querySelector('[data-modal-title]'),
      description: document.querySelector('[data-modal-description]'),
      link: document.querySelector('[data-modal-link]'),
    },
  };

  const state = {
    rss: {
      feedsList: [],
      postsList: [],
      watchedPosts: [],
      processState: 'filling',
      errors: null,
      subscribedUrls: [],
    },
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
      showPost: null,
    },
  };
  const watchedState = initView(elements, state);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

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
      watchedState.rss.errors = null;
      watchedState.rss.errors = i18next.t('errorMessages.alreadyExists');
      watchedState.rss.processState = 'subscribeError';
      watchedState.rss.processState = 'filling';
      return;
    }

    watchedState.form.processState = 'sanding';
    axios.get(addProxy(formData.get('url')))
      .then((response) => {
        watchedState.form.processState = 'filling';
        if (!isValidRSS(response.data.contents)) throw new Error('invalidRSS');

        watchedState.rss.errors = null;
        watchedState.rss.processState = 'success';
        watchedState.rss.processState = 'filling';

        const { feed, posts } = parseXML(response.data.contents);
        watchedState.rss.feedsList = [...watchedState.rss.feedsList, feed];
        watchedState.rss.postsList = [...posts, ...watchedState.rss.postsList];

        watchedState.rss.subscribedUrls = [...watchedState.rss.subscribedUrls, formData.get('url')];

        return new Promise((resolve) => {
          if (watchedState.rss.subscribedUrls.length === 1) resolve(watchedState.rss);
        });
      })
      .then((rssState) => subscribe(rssState))

      .catch((error) => {
        if (!!error.isAxiosError && !error.response) {
          watchedState.form.processState = 'networkFiled';
          return;
        }
        if (error.message === 'invalidRSS') {
          watchedState.rss.errors = i18next.t('errorMessages.invalidRss');
          watchedState.rss.processState = 'invalid';
          return;
        }
        watchedState.form.processState = 'filed';
        throw new Error(error);
      });
  });

  elements.postsList.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.target.closest('[data-bs-toggle="modal"]') !== null) {
      const id = +event.target.dataset.id;
      watchedState.modal.showPost = id;

      if (!watchedState.rss.watchedPosts.includes(id)) {
        watchedState.rss.watchedPosts.push(id);
      }
    }
  });

  elements.postModal.closedElements.forEach((closeBtn) => {
    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      watchedState.modal.showPost = null;
    });
  });
  // })
  // .catch((error) => {
  //   throw new Error(error);
  // });
};
