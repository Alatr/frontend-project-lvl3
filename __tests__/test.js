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
const dataRss1 = readFile('data-rss-1.txt').toString().trim();
const dataRss2 = readFile('data-rss-2.txt').toString().trim();

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
  const initHtml = readFile('index.html').toString().trim();
  document.body.innerHTML = initHtml;
  run();

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

    const scope = nock('https://hexlet-allorigins.herokuapp.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/get')
      .query({ url: 'https://ru.hexlet.io/lessons.rss' })
      .reply(200, dataRss1)
      .get('/get')
      .query({ url: 'https://ru.hexlet.io/lessons.wrong' })
      .reply(200, 'wronge-response')
      .get('/get')
      .query({ url: 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1' })
      .reply(200, dataRss2);

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
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });

    await userEvent.type(elements.formInput, 'https://ru.hexlet.io/lessons.wrong');
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue('https://ru.hexlet.io/lessons.wrong');
      expect(elements.formInput).toBeEnabled();
      expect(elements.formInput).not.toHaveClass('is-invalid');

      expect(elements.submitBtn).toBeEnabled();

      expect(elements.feedsList).not.toBeEmptyDOMElement();
      expect(elements.postsList).not.toBeEmptyDOMElement();
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('Ресурс не содержит валидный RSS');
    });

    await userEvent.clear(elements.formInput);
    await userEvent.type(elements.formInput, 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1');
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
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 1 item\(s\)/i)).toBeInTheDocument();
      expect(screen.getByText(/This is a constantly updating lorem ipsum feed/i)).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum 2021-01-01T00:00:00Z/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });
    scope.done();
  });

  test('add invalid rss', async () => {
    const scope = nock('https://hexlet-allorigins.herokuapp.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/get')
      .query({ url: 'https://ru.hexlet.io/lessons.wrong' })
      .reply(200, 'wronge-response');

    await userEvent.type(elements.formInput, 'https://ru.hexlet.io/lessons.wrong');
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue('https://ru.hexlet.io/lessons.wrong');
      expect(elements.formInput).toBeEnabled();
      expect(elements.formInput).not.toHaveClass('is-invalid');

      expect(elements.submitBtn).toBeEnabled();

      expect(elements.feedsList).toBeEmptyDOMElement();
      expect(elements.postsList).toBeEmptyDOMElement();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('Ресурс не содержит валидный RSS');
    });

    scope.done();
  });

  test('add one valid rss', async () => {
    const scope = nock('https://hexlet-allorigins.herokuapp.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/get')
      .query({ url: 'https://ru.hexlet.io/lessons.rss' })
      .reply(200, dataRss1);

    await userEvent.type(elements.formInput, 'https://ru.hexlet.io/lessons.rss');

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
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });
    scope.done();
  });

  test('add two valid rss', async () => {
    await userEvent.type(elements.formInput, 'https://ru.hexlet.io/lessons.rss');

    const scope = nock('https://hexlet-allorigins.herokuapp.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/get')
      .query({ url: 'https://ru.hexlet.io/lessons.rss' })
      .reply(200, dataRss1)
      .get('/get')
      .query({ url: 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1' })
      .reply(200, dataRss2);

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
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });

    await userEvent.type(elements.formInput, 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1');
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
      expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
      expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
      expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
      expect(screen.getByText(/Посты/i)).toBeInTheDocument();
      expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 1 item\(s\)/i)).toBeInTheDocument();
      expect(screen.getByText(/This is a constantly updating lorem ipsum feed/i)).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum 2021-01-01T00:00:00Z/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
    });
    scope.done();
  });

  test('invalid link', async () => {
    await userEvent.type(elements.formInput, 'wrong-email');

    userEvent.click(elements.submitBtn);

    expect(elements.formInput).toHaveClass('is-invalid');
    expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
    expect(elements.feedbackMessageBlock).toHaveTextContent('Ссылка должна быть валидным URL');
  });
});
