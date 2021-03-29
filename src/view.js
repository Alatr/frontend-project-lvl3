import onChange from 'on-change';

export default (elements, i18next, state) => {
  elements.formInput.focus();

  const renderModalPosts = () => {
    const domElements = elements;
    if (state.modal.activePost === null) {
      domElements.postModal.title.innerHTML = '';
      domElements.postModal.description.innerHTML = '';
      domElements.postModal.link.setAttribute('href', '#');
      return;
    }
    const { title, description, link } = state.postsList
      .find(({ postId }) => +state.modal.activePost === +postId);

    domElements.postModal.title.innerHTML = title;
    domElements.postModal.description.innerHTML = description;
    domElements.postModal.link.setAttribute('href', link);
  };
  const renderRssPosts = () => {
    const list = elements.postsList;
    const postItems = state.postsList
      .map(({ title, postId, link }) => (
        `<li class="list-group-item d-flex justify-content-between align-items-start">
          <a href="${link}" class="fw-${(state.watchedPosts.has(+postId)) ? 'normal font-weight-normal' : 'bold font-weight-bold'} text-decoration-none" data-id="${postId} " target="_blank" rel="noopener noreferrer">${title}</a>
          <button type="button" class="btn btn-primary btn-sm" data-id="${postId}" data-bs-toggle="modal" data-bs-target="#modal">${i18next.t('viewButtonModal')}</button>
        </li>`
      ))
      .join('\n');
    list.innerHTML = `
      <h2>${i18next.t('titlePost')}</h2>
      <ul class="list-group">
        ${postItems}
      </ul>`;
  };
  const renderRssFeeds = () => {
    const list = elements.feedsList;
    const feedsItems = state.feedsList
      .map(({ title, description }) => `<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`)
      .reverse()
      .join('\n');

    list.innerHTML = `
      <h2>${i18next.t('titleFeed')}</h2>
      <ul class="list-group mb-5">
          ${feedsItems}
      </ul>`;
  };
  const renderRssLoading = () => {
    const DOMElements = elements;
    switch (state.rssLoading.processState) {
      case 'loading':
        elements.submitBtn.setAttribute('disabled', true);
        elements.formInput.setAttribute('readonly', true);
        break;
      case 'networkFiled':
        elements.feedbackMessageBlock.classList.add('text-danger');
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;
      case 'invalidRssFeed':
        DOMElements.feedbackMessageBlock.classList.add('text-danger');
        DOMElements.submitBtn.removeAttribute('disabled');
        DOMElements.formInput.removeAttribute('readonly');
        break;
      case 'filed':
        elements.feedbackMessageBlock.classList.add('text-danger');
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;
      case 'successLoad':
        DOMElements.formInput.value = '';
        DOMElements.formInput.focus();
        DOMElements.feedbackMessageBlock.classList.add('text-success');
        DOMElements.feedbackMessageBlock.textContent = i18next.t('successLoadValidation');
        break;
      case 'idle':
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;
      default:
        throw Error(`Unknown form processState: ${state.rssLoading.processState}`);
    }
  };
  const renderRssLoadingError = () => {
    const DOMElements = elements;

    switch (state.rssLoading.errors) {
      case 'network-error':
        DOMElements.feedbackMessageBlock.textContent = i18next.t('errorMessages.network');
        break;
      case 'invalidRssError':
        DOMElements.feedbackMessageBlock.textContent = i18next.t('errorMessages.invalidRss');
        break;
      case 'unknown-error':
        DOMElements.feedbackMessageBlock.textContent = i18next.t('errorMessages.unknownError');
        break;
      case null:
        elements.feedbackMessageBlock.classList.remove('text-danger');
        break;
      default:
        throw Error(`Unknown form processState: ${state.rssLoading.error}`);
    }
  };
  const renderFormValidation = () => {
    const DOMElements = elements;

    elements.formInput.classList.remove('is-invalid');
    elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger');

    switch (state.form.processState) {
      case 'error':
        elements.feedbackMessageBlock.classList.add('text-danger');
        DOMElements.feedbackMessageBlock.textContent = state.form.errors;
        elements.formInput.classList.add('is-invalid');
        break;
      case 'validUrl':
        DOMElements.feedbackMessageBlock.textContent = state.form.errors ?? '';
        break;
      case 'filling':
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;
      case 'success':
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;

      default:
        throw Error(`Unknown form processState: ${state.form.processState}`);
    }
  };

  const mapping = {
    'form.processState': () => renderFormValidation(),
    'rssLoading.processState': () => renderRssLoading(),
    'rssLoading.errors': () => renderRssLoadingError(),
    feedsList: () => renderRssFeeds(),
    postsList: () => renderRssPosts(),
    watchedPosts: () => renderRssPosts(),
    'modal.activePost': () => renderModalPosts(),
  };

  const watchedState = onChange(state, (path) => {
    // console.log('--------', path, value, previousValue, name);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
