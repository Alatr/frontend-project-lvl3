import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import init from './app.js';
import resources from './locales';

export default () => {
  i18next.init({
    lng: 'ru',
    resources,
  }, () => {
    init();
  });
};
