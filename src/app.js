import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import initView from './view.js';

function isValid(url) {
  const schema = yup.string().required().trim().url('Ссылка должна быть валидным URL');
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
  const ID = _.uniqueId('feed');
  const posts = [...newDocument.querySelectorAll('channel > item')].map((post) => ({
    feed: ID,
    postId: _.uniqueId('post'),
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

export default () => {
  const elements = {
    form: document.querySelector('[data-rss-form]'),
    formInput: document.querySelector('[data-rss-form] [data-rss-input]'),
    submitBtn: document.querySelector('[data-rss-form] [data-submit-button]'),
    formSubmitButton: document.querySelector('[data-rss-form] [data-rss-input]'),
    feedsList: document.querySelector('[data-feeds-list]'),
    postsList: document.querySelector('[data-posts-list]'),
    feedbackMessageBlock: document.querySelector('[data-feedback-block]'),
  };

  const state = {
    rss: {
      feedsList: [],
      postsList: [],
      processState: 'filling',
      errors: null,

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
  };
  const watchedState = initView(elements, state);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const validationError = isValid(formData.get('url'));
    if (validationError) {
      watchedState.form.valid = false;
      watchedState.form.errors = validationError;
      watchedState.form.processState = 'error';
      return;
    }

    watchedState.form.valid = true;
    watchedState.form.errors = validationError;
    watchedState.form.fields.url = formData.get('url');
    watchedState.form.processState = 'validUrl';

    watchedState.form.processState = 'sanding';
    axios.get(addProxy(watchedState.form.fields.url))
      .then((response) => {
        watchedState.form.processState = 'filling';
        if (!isValidRSS(response.data.contents)) throw new Error('invalidRSS');

        watchedState.rss.errors = null;
        watchedState.rss.processState = 'success';
        watchedState.rss.processState = 'filling';

        const { feed, posts } = parseXML(response.data.contents);
        watchedState.rss.feedsList = [...watchedState.rss.feedsList, feed];
        watchedState.rss.postsList = [...posts, ...watchedState.rss.postsList];
      })

      .catch((error) => {
        if (!!error.isAxiosError && !error.response) {
          watchedState.form.processState = 'networkFiled';
          return;
        }
        if (error.message === 'invalidRSS') {
          watchedState.rss.errors = 'Ресурс не содержит валидный RSS';
          watchedState.rss.processState = 'invalid';
          return;
        }
        watchedState.form.processState = 'filed';
        throw new Error(error);
      });
  });
};
