import onChange from 'on-change';
import i18next from 'i18next';
import 'bootstrap/dist/css/bootstrap.min.css';

const renderRssPosts = (rss, elements) => {
  const list = elements.postsList;
  const postItems = rss.postsList
    .map(({ title, postId, link }) => (
      `<li class="list-group-item d-flex justify-content-between align-items-start">
        <a href="${link}" class="font-weight-bold" data-id="${postId}" target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-primary btn-sm" data-id="${postId}" data-toggle="modal" data-target="#modal">${i18next.t('viewButtonModal')}</button>
      </li>`
    ))
    .join('\n');
  list.innerHTML = `
    <h2>${i18next.t('titlePost')}</h2>
    <ul class="list-group">
      ${postItems}
    </ul>`;
};
const renderRssFeeds = (rss, elements) => {
  const list = elements.feedsList;
  const feedsItems = rss.feedsList
    .map(({ title, description }) => `<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`)
    .reverse()
    .join('\n');

  list.innerHTML = `
    <h2>${i18next.t('titleFeed')}</h2>
    <ul class="list-group mb-5">
        ${feedsItems}
    </ul>`;
};

const renderRssValidation = (rss, elements) => {
  const DOMElements = elements;
  switch (rss.processState) {
    case 'invalid':
      DOMElements.feedbackMessageBlock.classList.add('text-danger');
      DOMElements.feedbackMessageBlock.textContent = rss.errors;
      DOMElements.submitBtn.removeAttribute('disabled');
      DOMElements.formInput.removeAttribute('disabled');
      break;
    case 'filling':
      break;
    case 'success':
      DOMElements.formInput.value = '';
      DOMElements.formInput.focus();
      DOMElements.feedbackMessageBlock.classList.add('text-success');
      DOMElements.feedbackMessageBlock.textContent = i18next.t('successLoadValidation');
      break;
    default:
      throw Error(`Unknown rss processState: ${rss.processState}`);
  }
};

const renderFormValidation = (form, elements) => {
  const DOMElements = elements;

  elements.formInput.classList.remove('is-invalid');
  elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger');

  switch (form.processState) {
    case 'error':
      elements.formInput.classList.add('is-invalid');
      elements.feedbackMessageBlock.classList.add('text-danger');
      DOMElements.feedbackMessageBlock.textContent = form.errors;
      break;
    case 'validUrl':
      DOMElements.feedbackMessageBlock.textContent = form.errors ?? '';
      break;
    case 'sanding':
      elements.submitBtn.setAttribute('disabled', true);
      elements.formInput.setAttribute('disabled', true);
      break;
    case 'filling':
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;
    case 'filed':
      DOMElements.feedbackMessageBlock.textContent = i18next.t('errorMessages.unknownError');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;
    case 'networkFiled':
      DOMElements.feedbackMessageBlock.textContent = i18next.t('errorMessages.network');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;
    case 'success':
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;

    default:
      throw Error(`Unknown form processState: ${form.processState}`);
  }
};

export default (elements, state) => {
  elements.formInput.focus();

  const mapping = {
    'form.processState': () => renderFormValidation(state.form, elements),
    'rss.processState': () => renderRssValidation(state.rss, elements),
    'rss.feedsList': () => renderRssFeeds(state.rss, elements),
    'rss.postsList': () => renderRssPosts(state.rss, elements),
  };

  const watchedState = onChange(state, (path, value, previousValue, name) => {
    console.log('--------', path, value, previousValue, name);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
