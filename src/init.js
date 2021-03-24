import i18next from 'i18next';
import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';
import resources from './locales';
import addProxy from './proxy.js';
import { xmlParser, getXMLDOM } from './xmlParser.js';

import { addRssHandler, readFeedHandler } from './app.js';

function subscribe(rssState) {
  const state = rssState;
  const promises = Object.values(state.subscribedUrls).map((url) => axios.get(addProxy(url))
    .then((response) => ({ status: 'success', xml: getXMLDOM(response.data.contents) }))
    .catch((error) => ({ status: 'error', error })));

  return Promise.all(promises)
    .then((response) => new Promise((resolve) => {
      const newPosts = response
        .filter(({ status }) => status === 'success')
        .flatMap(({ xml }) => xmlParser(xml).posts)
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
        url: i18next.t('errorMessages.url'),
      },
    });

    const instances = {
      i18next: i18nextInstance,
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
        title: document.querySelector('[data-modal-title]'),
        description: document.querySelector('[data-modal-description]'),
        link: document.querySelector('[data-modal-link]'),
      },
    };

    const state = {
      network: {
        processAddRssFeed: 'filling',
      },
      rss: {
        feedsList: [],
        postsList: [],
        watchedPosts: [],
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

    elements.postModal.modal.addEventListener('hide.bs.modal', () => {
      watchedState.modal.showPost = null;
    });
  });
};
