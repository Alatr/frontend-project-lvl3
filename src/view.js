import onChange from 'on-change';

const renderForm = (form, elements) => {
  switch (form.status) {
    case 'filling':
      break;

    default:
      throw Error(`Unknown form status: ${form.status}`);
  }
};

export default (elements, state) => {
  console.log(elements);
  elements.formInput.focus();

  const mapping = {
    'form.status': () => renderForm(state.form, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
