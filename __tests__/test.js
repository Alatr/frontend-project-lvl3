import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import {
  screen, waitFor,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import run from '../src/app';

const getFixturePath = (filename) => path.resolve('__tests__', '__fixtures__', filename);
const readFile = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');
const elements = {};
let response = null;

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
  const initHtml = readFile('index.html').toString().trim();
  document.body.innerHTML = initHtml;
  run();

  response = readFile('response.txt').toString().trim();

  elements.formInput = screen.getByPlaceholderText('ссылка RSS');
  elements.submitBtn = screen.getByText(/Add/i);
  elements.feedsList = screen.getByTestId('feeds');
  elements.postsList = screen.getByTestId('posts');
  elements.feedbackMessageBlock = screen.getByTestId('feedback');
});

describe('app', () => {
  test('fresh application', () => {
    expect(elements.formInput).toBeRequired();
    expect(elements.formInput).toHaveFocus();
    expect(elements.formInput).not.toHaveValue();
    expect(elements.formInput).toBeEnabled();
    expect(elements.formInput).not.toHaveClass('is-invalid');

    expect(elements.submitBtn).toBeEnabled();

    expect(elements.feedsList).toBeEmptyDOMElement();
    expect(elements.postsList).toBeEmptyDOMElement();

    expect(elements.feedbackMessageBlock).toBeEmptyDOMElement();
    expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
    expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
  });

  test('main flow', async () => {
    await userEvent.type(elements.formInput, 'wrong-email');

    userEvent.click(elements.submitBtn);

    expect(elements.formInput).toHaveClass('is-invalid');
    expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
    expect(elements.feedbackMessageBlock).toHaveTextContent('Ссылка должна быть валидным URL');

    await userEvent.clear(elements.formInput);
    await userEvent.type(elements.formInput, 'https://ru.hexlet.io/lessons.rss');

    const scope = nock('http://localhost')
      .persist()
      .get('/')
      .reply(200, response);

    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();
      expect(elements.formInput).not.toHaveClass('is-invalid');

      expect(elements.submitBtn).toBeEnabled();

      expect(elements.feedsList).not.toBeEmptyDOMElement();
      expect(elements.postsList).not.toBeEmptyDOMElement();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });

    scope.done();
    scope.persist(false);
  });
});
