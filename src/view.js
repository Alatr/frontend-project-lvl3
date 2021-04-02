import onChange from 'on-change';

export default (elements, i18next, state) => {
  elements.formInput.focus();

  const renderModalPosts = () => {
    if (state.modal.activePost === null) {
      elements.postModal.modal.querySelector('[data-modal-title]').innerHTML = '';
      elements.postModal.modal.querySelector('[data-modal-description]').innerHTML = '';
      elements.postModal.modal.querySelector('[data-modal-link]').setAttribute('href', '#');
      return;
    }
    const { title, description, link } = state.posts
      .find(({ postId }) => +state.modal.activePost === +postId);

    elements.postModal.modal.querySelector('[data-modal-title]').innerHTML = title;
    elements.postModal.modal.querySelector('[data-modal-description]').innerHTML = description;
    elements.postModal.modal.querySelector('[data-modal-link]').setAttribute('href', link);
  };
  const renderRssPosts = () => {
    if (state.posts.length === 0) return;
    const list = elements.postsList;
    const postItems = state.posts
      .map(({ title, postId, link }) => (
        `<li class="list-group-item d-flex justify-content-between align-items-start">
          <a href="${link}" class="fw-${(state.ui.watchedPosts.has(+postId)) ? 'normal font-weight-normal' : 'bold font-weight-bold'} text-decoration-none" data-id="${postId} " target="_blank" rel="noopener noreferrer">${title}</a>
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
    const feedsItems = state.feeds
      .map(({ title, description }) => `<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`)
      .reverse()
      .join('\n');

    list.innerHTML = `
      <h2>${i18next.t('titleFeed')}</h2>
      <ul class="list-group mb-5">
          ${feedsItems}
      </ul>`;
  };
  const handleRssProccesStateChange = () => {
    switch (state.rssLoading.processState) {
      case 'loading':
        elements.submitBtn.setAttribute('disabled', true);
        elements.formInput.setAttribute('readonly', true);
        break;
      case 'error':
        elements.feedbackMessageBlock.classList.add('text-danger');
        break;
      case 'successLoad':
        elements.formInput.value = '';
        elements.formInput.focus();
        elements.feedbackMessageBlock.classList.add('text-success');
        elements.feedbackMessageBlock.textContent = i18next.t('successLoadValidation');
        break;
      case 'idle':
        elements.submitBtn.removeAttribute('disabled');
        elements.formInput.removeAttribute('readonly');
        break;
      default:
        throw Error(`Unknown form processState: ${state.rssLoading.processState}`);
    }
  };
  const handleRssErrorProccesStateChange = () => {
    switch (state.rssLoading.errors) {
      case 'network-error':
        elements.feedbackMessageBlock.textContent = i18next.t('errorMessages.network');
        break;
      case 'invalidRssError':
        elements.feedbackMessageBlock.textContent = i18next.t('errorMessages.invalidRss');
        break;
      case 'unknown-error':
        elements.feedbackMessageBlock.textContent = i18next.t('errorMessages.unknownError');
        break;
      case null:
        elements.feedbackMessageBlock.classList.remove('text-danger');
        break;
      default:
        throw Error(`Unknown form processState: ${state.rssLoading.error}`);
    }
  };
  const handleFormProccesStateChange = () => {
    elements.formInput.classList.remove('is-invalid');
    elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger');

    switch (state.form.processState) {
      case 'error':
        elements.feedbackMessageBlock.classList.add('text-danger');
        elements.feedbackMessageBlock.textContent = state.form.errors;
        elements.formInput.classList.add('is-invalid');
        break;
      case 'validUrl':
        elements.feedbackMessageBlock.textContent = state.form.errors ?? '';
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
    'form.processState': () => handleFormProccesStateChange(),
    'rssLoading.processState': () => handleRssProccesStateChange(),
    'rssLoading.errors': () => handleRssErrorProccesStateChange(),
    feeds: () => renderRssFeeds(),
    posts: () => renderRssPosts(),
    'ui.watchedPosts': () => renderRssPosts(),
    'modal.activePost': () => renderModalPosts(),
  };

  const watchedState = onChange(state, (path) => {
    // console.log('--------', path, value);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
