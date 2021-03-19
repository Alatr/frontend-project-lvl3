import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import {
  screen, waitFor, getByText,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import run from '../src/init.js';

const getFixturePath = (filename) => path.resolve('__tests__', '__fixtures__', filename);
const readFile = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');

const elements = {};
const dataRss1 = readFile('data-rss-1.txt').toString().trim();
const dataRss2 = readFile('data-rss-2.txt').toString().trim();
const defaultReplyHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-credentials': 'true',
};
const url = {
  mainLinkProxy: 'https://hexlet-allorigins.herokuapp.com',
  rssLink1: 'https://ru.hexlet.io/lessons.rss',
  rssLink2: 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1',
  rssLinkWrong: 'https://ru.hexlet.io/lessons.wrong',
};

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

beforeEach(async () => {
  const initHtml = readFile('index.html').toString().trim();
  document.body.innerHTML = initHtml;
  await run();

  elements.formInput = screen.getByPlaceholderText('ссылка RSS');
  elements.submitBtn = screen.getByText(/Add/i);
  elements.feedsList = screen.getByTestId('feeds');
  elements.postsList = screen.getByTestId('posts');
  elements.feedbackMessageBlock = screen.getByTestId('feedback');
  elements.modal = screen.getByTestId('modal');
  elements.modalCloseBtn = screen.getByText(/закрыть/i);
});

describe('app', () => {
  /*
  test('fresh application', () => {
    expect(elements.formInput).toBeRequired();
    expect(elements.formInput).toHaveFocus();
    expect(elements.formInput).not.toHaveValue();
    expect(elements.formInput).toBeEnabled();
    expect(elements.formInput).not.toHaveClass('is-invalid');

    expect(elements.submitBtn).toBeEnabled();

    expect(screen.queryByText(/Просмотр/i)).toBeNull();
    expect(elements.feedsList).toBeEmptyDOMElement();
    expect(elements.postsList).toBeEmptyDOMElement();

    expect(elements.feedbackMessageBlock).toBeEmptyDOMElement();

    // expect(elements.modal).not.toBeVisible();
  });

  test('main flow', async () => {
    nock(url.mainLinkProxy)
      .persist()
      .defaultReplyHeaders(defaultReplyHeaders)
      .get('/get')
      .query({ url: url.rssLink1 })
      .reply(200, dataRss1)
      .get('/get')
      .query({ url: url.rssLinkWrong })
      .reply(200, 'wronge-response')
      .get('/get')
      .query({ url: url.rssLink2 })
      .reply(200, dataRss2);

    await userEvent.type(elements.formInput, 'wrong-email');
    userEvent.click(elements.submitBtn);

    expect(elements.feedbackMessageBlock).toHaveTextContent(/^Ссылка должна быть валидным URL$/i);

    await userEvent.clear(elements.formInput);
    await userEvent.type(elements.formInput, url.rssLink1);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });

    await userEvent.type(elements.formInput, url.rssLinkWrong);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLinkWrong);
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^Ресурс не содержит валидный RSS$/i);
    });

    await userEvent.clear(elements.formInput);
    await userEvent.type(elements.formInput, url.rssLink2);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum feed for an interval of 1 years with 1 item\(s\)$/i)).toBeInTheDocument();
      expect(screen.getByText(/^This is a constantly updating lorem ipsum feed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum 2021-01-01T00:00:00Z$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });

    await userEvent.type(elements.formInput, url.rssLink1);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLink1);
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum feed for an interval of 1 years with 1 item\(s\)$/i)).toBeInTheDocument();
      expect(screen.getByText(/^This is a constantly updating lorem ipsum feed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum 2021-01-01T00:00:00Z$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS уже существует$/i);
    });

    userEvent.click(screen.getAllByText(/просмотр/i)[0]);
    getByText(document.querySelector('#modal'), /^Lorem ipsum 2021-01-01T00:00:00Z$/i);
    getByText(document.querySelector('#modal'), /^Cupidatat aliqua minim incididunt adipisicing officia proident quis pariatur fugiat consequat\.$/i);
    userEvent.click(screen.getByText(/закрыть/i));

    userEvent.click(screen.getAllByText(/просмотр/i)[1]);

    getByText(document.querySelector('#modal'), /^Рациональные числа \/ Ruby: Составные данные$/i);
    getByText(document.querySelector('#modal'), /^Цель: Рассмотреть рациональные числа как новый пример абстракции на основе пар чисел\.$/i);
    userEvent.click(screen.getByText(/закрыть/i));

    userEvent.click(screen.getAllByText(/просмотр/i)[2]);

    getByText(document.querySelector('#modal'), /^Реализация пар \/ Ruby: Составные данные$/i);
    getByText(document.querySelector('#modal'), /^Цель: Написать собственную реализацию пар на языке Ruby\.$/i);
    userEvent.click(screen.getByText(/закрыть/i));
  });

  test('add invalid rss', async () => {
    nock(url.mainLinkProxy)
      .persist()
      .defaultReplyHeaders(defaultReplyHeaders)
      .get('/get')
      .query({ url: url.rssLinkWrong })
      .reply(200, 'wronge-response');

    await userEvent.type(elements.formInput, url.rssLinkWrong);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLinkWrong);
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(elements.feedsList).toBeEmptyDOMElement();
      expect(elements.postsList).toBeEmptyDOMElement();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^Ресурс не содержит валидный RSS$/i);
    });
  });

  test('add one valid rss', async () => {
    nock(url.mainLinkProxy)
      .persist()
      .defaultReplyHeaders(defaultReplyHeaders)
      .get('/get')
      .query({ url: url.rssLink1 })
      .reply(200, dataRss1);

    await userEvent.type(elements.formInput, url.rssLink1);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });
  });

  test('add two already exists rss', async () => {
    await userEvent.type(elements.formInput, url.rssLink1);

    nock(url.mainLinkProxy)
      .defaultReplyHeaders(defaultReplyHeaders)
      .persist()
      .get('/get')
      .query({ url: url.rssLink1 })
      .reply(200, dataRss1);

    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });

    await userEvent.type(elements.formInput, url.rssLink1);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLink1);
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS уже существует$/i);
    });
  });
  test('add two valid rss', async () => {
    await userEvent.type(elements.formInput, url.rssLink1);

    nock(url.mainLinkProxy)
      .defaultReplyHeaders(defaultReplyHeaders)
      .persist()
      .get('/get')
      .query({ url: url.rssLink1 })
      .reply(200, dataRss1)
      .get('/get')
      .query({ url: url.rssLink2 })
      .reply(200, dataRss2);

    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });

    await userEvent.type(elements.formInput, url.rssLink2);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).toBeEnabled();

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^Фиды$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Новые уроки на Хекслете$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Практические уроки по программированию$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Посты$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Рациональные числа \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Реализация пар \/ Ruby: Составные данные$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum feed for an interval of 1 years with 1 item\(s\)$/i)).toBeInTheDocument();
      expect(screen.getByText(/^This is a constantly updating lorem ipsum feed$/i)).toBeInTheDocument();
      expect(screen.getByText(/^Lorem ipsum 2021-01-01T00:00:00Z$/i)).toBeInTheDocument();

      expect(elements.feedbackMessageBlock).toHaveTextContent(/^RSS успешно загружен$/i);
    });
  });

  test('invalid link', async () => {
    await userEvent.type(elements.formInput, 'wrong-email');

    userEvent.click(elements.submitBtn);

    expect(elements.feedbackMessageBlock).toHaveTextContent(/^Ссылка должна быть валидным URL$/i);
  });
*/
  test('adding', async () => {
    const url2 = {
      mainLinkProxy: 'https://hexlet-allorigins.herokuapp.com',
      rssLink1: 'https://ru.hexlet.io/lessons.rss',
      rssLink2: 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1',
      rssLinkWrong: 'https://ru.hexlet.io/lessons.wrong',
    };
    const scope = nock(url2.mainLinkProxy)
      // .defaultReplyHeaders(defaultReplyHeaders)
      // .persist()
      .get('/get')
      .query({ url: url2.rssLink1, disableCache: 'true' })
      .reply(200, dataRss1);

    // .query({ url: url.rssLink1 })
    // .reply(200, dataRss1)

    // nock(url.mainLinkProxy)
    //   .defaultReplyHeaders(defaultReplyHeaders)
    //   .persist()
    userEvent.type(screen.getByRole('textbox', { name: 'url' }), url.rssLink1);
    userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();
    scope.done();
  });
});
