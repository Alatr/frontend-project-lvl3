import i18next from 'i18next';
import axios from 'axios';
import * as yup from 'yup';
import { Modal } from 'bootstrap';
import initView from './view.js';
import resources from './locales';
import addProxy from './proxy.js';
import xmlParser from './xmlParser.js';

import { addRssHandler, readFeedHandler } from './app.js';

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
        .flatMap(({ xml }) => xmlParser(xml).posts)
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
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    resources,
  }, () => {
    yup.setLocale({
      string: {
        url: i18next.t('errorMessages.url'),
      },
    });

    const instances = {
      i18next: i18nextInstance,
      modal: new Modal(document.getElementById('modal'), { backdrop: 'static' }),
      yup,
    };

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
    const watchedState = initView(elements, instances, state);

    subscribe(watchedState.rss);

    elements.form.addEventListener('submit', addRssHandler(watchedState, instances));

    elements.postsList.addEventListener('click', readFeedHandler(watchedState));

    elements.postModal.closedElements.forEach((closeBtn) => {
      closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        watchedState.modal.showPost = null;
      });
    });

    // init();
  });
};
