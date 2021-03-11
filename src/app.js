import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import initView from './view.js';

function isValid(data) {
  const schema = yup.object().shape({
    url: yup.string().required(),
  });

  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
}

export default () => {
  const elements = {
    form: document.querySelector('[data-rss-form]'),
    formInput: document.querySelector('[data-rss-form] [data-rss-input]'),
    feedsList: document.querySelector('[data-feeds-list]'),
    postsList: document.querySelector('[data-posts-list]'),
    feedbackMessageBlock: document.querySelector('[data-feedback-block]'),
  };

  const state = {
    form: {
      processState: 'filling',
      processError: null,
      fields: {
        url: null,
      },
      valid: true,
      errors: {},
    },
  };
  const watchedState = initView(elements, state);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(e.target);
    const error = isValid(data);

    if (error) {

    }
  });
};
