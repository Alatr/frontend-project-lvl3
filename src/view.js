import onChange from 'on-change';

const renderModalPosts = (modalState, postList, elements) => {
  const domElements = elements;
  if (modalState.showPost === null) {
    domElements.postModal.title.innerHTML = '';
    domElements.postModal.description.innerHTML = '';
    domElements.postModal.link.setAttribute('href', '#');
    return;
  }

  const { title, description, link } = postList
    .find(({ postId }) => +modalState.showPost === +postId);

  domElements.postModal.title.innerHTML = title;
  domElements.postModal.description.innerHTML = description;
  domElements.postModal.link.setAttribute('href', link);
};
const renderRssPosts = (rss, instances, elements) => {
  const list = elements.postsList;
  const postItems = rss.postsList
    .map(({ title, postId, link }) => (
      `<li class="list-group-item d-flex justify-content-between align-items-start">
        <a href="${link}" class="fw-${(rss.watchedPosts.includes(+postId)) ? 'normal font-weight-normal' : 'bold font-weight-bold'} text-decoration-none" data-id="${postId} " target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-primary btn-sm" data-id="${postId}" data-bs-toggle="modal" data-bs-target="#modal">${instances.i18next.t('viewButtonModal')}</button>
      </li>`
    ))
    .join('\n');
  list.innerHTML = `
    <h2>${instances.i18next.t('titlePost')}</h2>
    <ul class="list-group">
      ${postItems}
    </ul>`;
};
const renderRssFeeds = (rss, instances, elements) => {
  const list = elements.feedsList;
  const feedsItems = rss.feedsList
    .map(({ title, description }) => `<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`)
    .reverse()
    .join('\n');

  list.innerHTML = `
    <h2>${instances.i18next.t('titleFeed')}</h2>
    <ul class="list-group mb-5">
        ${feedsItems}
    </ul>`;
};

const renderFormValidation = (form, instances, elements) => {
  const DOMElements = elements;

  elements.formInput.classList.remove('is-invalid');
  elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger');

  switch (form.processState) {
    case 'invalidRssFeed':
      DOMElements.feedbackMessageBlock.classList.add('text-danger');
      DOMElements.feedbackMessageBlock.textContent = form.errors;
      DOMElements.submitBtn.removeAttribute('disabled');
      DOMElements.formInput.removeAttribute('readonly');
      break;
    case 'successAddFeed':
      DOMElements.formInput.value = '';
      DOMElements.formInput.focus();
      DOMElements.feedbackMessageBlock.classList.add('text-success');
      DOMElements.feedbackMessageBlock.textContent = instances.i18next.t('successLoadValidation');
      break;
    case 'subscribeError':
      DOMElements.feedbackMessageBlock.classList.add('text-danger');
      DOMElements.feedbackMessageBlock.textContent = form.errors;
      elements.formInput.classList.add('is-invalid');
      break;
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
      elements.formInput.setAttribute('readonly', true);
      break;
    case 'filling':
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('readonly');
      break;
    case 'filed':
      DOMElements.feedbackMessageBlock.textContent = instances.i18next.t('errorMessages.unknownError');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('readonly');
      break;
    case 'networkFiled':
      DOMElements.feedbackMessageBlock.textContent = instances.i18next.t('errorMessages.network');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('readonly');
      break;
    case 'success':
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('readonly');
      break;

    default:
      throw Error(`Unknown form processState: ${form.processState}`);
  }
};

export default (elements, instances, state) => {
  elements.formInput.focus();

  const mapping = {
    'form.processState': () => renderFormValidation(state.form, instances, elements),
    'rss.feedsList': () => renderRssFeeds(state.rss, instances, elements),
    'rss.postsList': () => renderRssPosts(state.rss, instances, elements),
    'rss.watchedPosts': () => renderRssPosts(state.rss, instances, elements),
    'modal.showPost': () => renderModalPosts(state.modal, state.rss.postsList, elements),
  };

  const watchedState = onChange(state, (path) => {
    // console.log('--------', path, value, previousValue, name);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
