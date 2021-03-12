import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import axios from 'axios';
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
  console.log(newDocument);

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
      list: null,
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
    const error = isValid(formData.get('url'));
    if (error) {
      watchedState.form.valid = false;
      watchedState.form.errors = error;
      watchedState.form.processState = 'error';
      return;
    }
    watchedState.form.valid = true;
    watchedState.form.errors = error;
    watchedState.form.fields.url = formData.get('url');
    watchedState.form.processState = 'validUrl';

    watchedState.form.processState = 'sanding';

    axios.get(addProxy(watchedState.form.fields.url))
      .then((response) => {
        watchedState.form.processState = 'filling';
        if (!isValidRSS(response.data.contents)) throw new Error('invalidRSS');

        watchedState.rss.errors = null;
        watchedState.rss.processState = 'filling';

        const data = parseXML(response.data.contents);
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
      });
  });
};
