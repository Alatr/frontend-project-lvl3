import i18next from 'i18next';
import init from './app.js';
import resources from './locales';

export default () => {
  console.log(3);
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    // debug: true,
    resources,
  })
    .then(() => {
      console.log(2);
      init(i18nextInstance);
    })
    .catch((error) => {
      throw new Error(error);
    });
};
