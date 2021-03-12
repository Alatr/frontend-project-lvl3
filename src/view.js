import onChange from 'on-change';

const renderRss = (rss, elements) => {
  // elements.formInput.classList.remove('is-invalid');
  // elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger')

  switch (rss.processState) {
    case 'invalid':
      elements.formInput.classList.add('is-invalid');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.feedbackMessageBlock.textContent = rss.errors;
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;
    case 'filling':
      // console.log(456456);
      // elements.formInput.classList.add('is-invalid');
      // elements.feedbackMessageBlock.classList.add('text-danger');
      // elements.feedbackMessageBlock.textContent = rss.errors;
      break;
    case 'success':
      // console.log(456456);
      // elements.formInput.classList.add('is-invalid');
      // elements.feedbackMessageBlock.classList.add('text-danger');
      // elements.feedbackMessageBlock.textContent = rss.errors;
      break;

    default:
      throw Error(`Unknown rss processState: ${rss.processState}`);
  }
};

const renderForm = (form, elements) => {
  elements.formInput.classList.remove('is-invalid');
  elements.feedbackMessageBlock.classList.remove('text-success', 'text-danger');

  switch (form.processState) {
    case 'error':
      elements.formInput.classList.add('is-invalid');
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.feedbackMessageBlock.textContent = form.errors;
      break;
    case 'validUrl':
      elements.feedbackMessageBlock.textContent = form.errors ?? '';
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
      elements.feedbackMessageBlock.textContent = 'Неизвестная ошибка';
      elements.feedbackMessageBlock.classList.add('text-danger');
      elements.submitBtn.removeAttribute('disabled');
      elements.formInput.removeAttribute('disabled');
      break;
    case 'networkFiled':
      elements.feedbackMessageBlock.textContent = 'Ошибка сети';
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
  console.log(elements);
  elements.formInput.focus();

  const mapping = {
    'form.processState': () => renderForm(state.form, elements),
    'rss.processState': () => renderRss(state.rss, elements),
  };

  const watchedState = onChange(state, (path, value, previousValue, name) => {
    console.log('--------', path, value, previousValue, name);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
