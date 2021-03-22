import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import {
  screen, waitFor,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';

import run from '../src/init.js';

const getFixturePath = (filename) => path.resolve('__tests__', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(getFixturePath(filename), 'utf-8');

const elements = {};
const responseRss1 = readFixture('data-rss-1.txt').toString().trim();
const responseRss2 = readFixture('data-rss-2.txt').toString().trim();
const titlePosts = [
  'Фиды',
  'Посты',
];
const dataPostsRss1 = [
  'Новые уроки на Хекслете',
  'Практические уроки по программированию',
  'Рациональные числа / Ruby: Составные данные',
  'Реализация пар / Ruby: Составные данные',
];
// const dataPostsRss2 = [
//   'Lorem ipsum feed for an interval of 1 years with 1 item(s)',
//   'This is a constantly updating lorem ipsum feed',
//   'Lorem ipsum 2021-01-01T00:00:00Z',
// ];
const proxySetting = {
  disableCache: 'true',
};

const urls = {
  mainLinkProxy: 'https://hexlet-allorigins.herokuapp.com',
  rssRequest1: { url: 'https://ru.hexlet.io/lessons.rss', ...proxySetting },
  rssRequest2: { url: 'http://lorem-rss.herokuapp.com/feed?unit=year&length=1', ...proxySetting },
  rssWrongRequest: { url: 'https://ru.hexlet.io/lessons.wrong', ...proxySetting },
};
let initHtml;
beforeAll(() => {
  nock.disableNetConnect();
  initHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8').toString().trim();
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

beforeEach(async () => {
  document.body.innerHTML = initHtml;
  await run();

  elements.formInput = screen.getByRole('textbox', { name: 'url' });
  elements.submitBtn = screen.getByRole('button', { name: /Add/i });
  elements.feedsList = screen.getByTestId('feeds');
  elements.postsList = screen.getByTestId('posts');
  elements.feedbackMessageBlock = screen.getByTestId('feedback');
  elements.modal = screen.getByTestId('modal');
});

describe('app', () => {
  test('add one valid rss', async () => {
    const scope = nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, responseRss1);

    await userEvent.type(elements.formInput, urls.rssRequest1.url);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toHaveFocus();
      expect(elements.formInput).not.toHaveValue();
      expect(elements.formInput).not.toHaveAttribute('readonly');

      expect(elements.submitBtn).toBeEnabled();

      expect(screen.getByText(/^RSS успешно загружен$/i)).toBeInTheDocument();
    });
    scope.done();
  });

  test('add feeds', async () => {
    const scope = nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, responseRss1);

    await userEvent.type(elements.formInput, urls.rssRequest1.url);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      [...titlePosts, ...dataPostsRss1].forEach((pattern) => {
        const regexp = new RegExp(pattern, 'i');
        expect(screen.getByText(regexp)).toBeInTheDocument();
      });
    });
    scope.done();
  });

  test('add two already exists rss', async () => {
    const scope = nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, responseRss1);

    await userEvent.type(elements.formInput, urls.rssRequest1.url);

    userEvent.click(elements.submitBtn);

    await waitFor(async () => {
      await userEvent.type(elements.formInput, urls.rssRequest1.url);

      userEvent.click(elements.submitBtn);

      expect(screen.queryByText(/RSS уже существует/i)).toBeInTheDocument();
    });
    scope.done();
  });

  test('add two valid rss', async () => {
    nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, responseRss1)
      .get('/get')
      .query(urls.rssRequest2)
      .reply(200, responseRss2);

    await userEvent.type(elements.formInput, urls.rssRequest1.url);
    userEvent.click(elements.submitBtn);

    await waitFor(async () => {
      await userEvent.type(elements.formInput, urls.rssRequest2.url);
      userEvent.click(elements.submitBtn);

      expect(await screen.findByText(/RSS успешно загружен/i)).toBeInTheDocument();

      [...titlePosts, ...dataPostsRss1].forEach((pattern) => {
        const regexp = new RegExp(pattern, 'i');
        expect(screen.getByText(regexp)).toBeInTheDocument();
      });
    });

    // [...dataPostsRss2].forEach(async (pattern) => {
    //   const regexp = new RegExp(pattern,"i");
    //   expect(await screen.findByText(regexp)).toBeInTheDocument();
    // });

    // scope.done()
  });

  test('invalid link', async () => {
    await userEvent.type(elements.formInput, 'wrong-rss');

    userEvent.click(elements.submitBtn);

    expect(screen.queryByText(/^Ссылка должна быть валидным URL$/i)).toBeInTheDocument();
  });

  test('add invalid rss', async () => {
    nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, 'wrong');

    await userEvent.type(elements.formInput, urls.rssRequest1.url);
    userEvent.click(elements.submitBtn);

    expect(await screen.findByText(/Ресурс не содержит валидный RSS/i)).toBeInTheDocument();
  });

  test('read post', async () => {
    const scope = nock(urls.mainLinkProxy)
      .get('/get')
      .query(urls.rssRequest1)
      .reply(200, responseRss1);

    await userEvent.type(elements.formInput, urls.rssRequest1.url);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      userEvent.click(screen.getAllByText(/просмотр/i)[0]);
      expect(screen.queryByText(/^Цель: Рассмотреть рациональные числа как новый пример абстракции на основе пар чисел\.$/i)).toBeInTheDocument();
      userEvent.click(screen.getByText(/закрыть/i));
      expect(screen.queryByText(/^Цель: Рассмотреть рациональные числа как новый пример абстракции на основе пар чисел\.$/i)).not.toBeInTheDocument();

      userEvent.click(screen.getAllByText(/просмотр/i)[1]);
    });
    scope.done();
  });
});

test('fresh application', () => {
  expect(elements.formInput).not.toHaveValue();
  expect(elements.formInput).not.toHaveAttribute('readonly');

  expect(elements.submitBtn).toBeEnabled();

  expect(elements.feedsList).toBeEmptyDOMElement();
  expect(elements.postsList).toBeEmptyDOMElement();

  expect(elements.feedbackMessageBlock).toBeEmptyDOMElement();

  expect(elements.modal).not.toHaveClass('show');
});

test('network error', async () => {
  const error = { message: 'network error', isAxiosError: true };

  nock(urls.mainLinkProxy)
    .get('/get')
    .query(urls.rssRequest1)
    .replyWithError(error);

  await userEvent.type(elements.formInput, urls.rssRequest1.url);
  userEvent.click(elements.submitBtn);

  expect(await screen.findByText(/Ошибка сети/i)).toBeInTheDocument();
});

test('accessibility ui', async () => {
  const scope = nock(urls.mainLinkProxy)
    .get('/get')
    .query(urls.rssRequest1)
    .reply(200, responseRss1);

  expect(elements.formInput).not.toHaveAttribute('readonly');
  expect(elements.submitBtn).toBeEnabled();

  await userEvent.type(elements.formInput, urls.rssRequest1.url);
  userEvent.click(elements.submitBtn);

  expect(elements.formInput).toHaveAttribute('readonly');
  expect(elements.submitBtn).toBeDisabled();

  await waitFor(() => {
    expect(elements.formInput).not.toHaveAttribute('readonly');
    expect(elements.submitBtn).toBeEnabled();
  });
  scope.done();
});
