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
  elements.modalTitle = screen.getByTestId('modal-title');
  elements.modalDescription = screen.getByTestId('modal-description');
  elements.modalLink = screen.getByTestId('modal-link');
  elements.modalCloseBtn = screen.getByText(/закрыть/i);
});

describe('app', () => {
  // test('fresh application', () => {
  //   expect(elements.formInput).toBeRequired();
  //   expect(elements.formInput).toHaveFocus();
  //   expect(elements.formInput).not.toHaveValue();
  //   expect(elements.formInput).toBeEnabled();
  //   expect(elements.formInput).not.toHaveClass('is-invalid');
    
  //   expect(elements.submitBtn).toBeEnabled();
    
  //   // expect(screen.queryByText(/Просмотр/i)).toBeNull();
    
    
    
  //   expect(elements.feedsList).toBeEmptyDOMElement();
  //   expect(elements.postsList).toBeEmptyDOMElement();
    
  //   expect(elements.feedbackMessageBlock).toBeEmptyDOMElement();
  //   expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
  //   expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
    
  //   expect(elements.modal).not.toHaveClass('show');
  //   expect(elements.modalTitle).toBeEmptyDOMElement();
  //   expect(elements.modalDescription).toBeEmptyDOMElement();
  //   expect(elements.modalLink).toHaveAttribute('href', '#');

  //   // expect(elements.modal).toHaveStyle(`display: none;`)
  //   expect(elements.modal).toBeInTheDocument();
    
  // });

  test('main flow', async () => {
    await userEvent.type(elements.formInput, 'wrong-email');

    userEvent.click(elements.submitBtn);

    expect(elements.formInput).toHaveClass('is-invalid');
    expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
    expect(elements.feedbackMessageBlock).toHaveTextContent('Ссылка должна быть валидным URL');

    await userEvent.clear(elements.formInput);
    await userEvent.type(elements.formInput, url.rssLink1);

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
    

    await userEvent.type(elements.formInput, url.rssLinkWrong);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLinkWrong);
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
    await userEvent.type(elements.formInput, url.rssLink2);
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

    await userEvent.type(elements.formInput, url.rssLink1);
    userEvent.click(elements.submitBtn);

    await waitFor(() => {
      expect(elements.formInput).toBeRequired();
      expect(elements.formInput).toHaveValue(url.rssLink1);
      expect(elements.formInput).toBeEnabled();
      expect(elements.formInput).toHaveClass('is-invalid');

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
      expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
      expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
      expect(elements.feedbackMessageBlock).toHaveTextContent('RSS уже существует');
    });


    userEvent.click(screen.getAllByText(/просмотр/i)[0]);

    await waitFor(() => {
      expect(elements.modal).toHaveClass('show');
      expect(elements.modalTitle).toHaveTextContent(/Lorem ipsum 2021-01-01T00:00:00Z/i);
      expect(elements.modalDescription).toHaveTextContent(/Cupidatat aliqua minim incididunt adipisicing officia proident quis pariatur fugiat consequat./);
      expect(elements.modalLink).toHaveAttribute('href', 'http://example.com/test/1609459200');
    });

    userEvent.click(screen.getByText(/закрыть/i), 'hide.bs.modal');
    // userEvent.click(elements.modal, 'hide.bs.modal');
    // document.dispatchEvent('hide.bs.modal');
    // userEvent.fireEvent(screen.getByText(/закрыть/i), 'hide.bs.modal')
    
    await waitFor(() => {
      expect(elements.modalTitle).toBeEmptyDOMElement()
      expect(elements.modalDescription).toBeEmptyDOMElement()
      expect(elements.modalLink).toHaveAttribute('href', '#');

      expect(elements.modal).toHaveStyle(`display: none;`)
      expect(elements.modal).not.toHaveClass('show');
    });

    // userEvent.click(screen.getAllByText(/просмотр/i)[1]);
    // await waitFor(() => {
    //   expect(elements.modalTitle).toHaveTextContent(/Рациональные числа \/ Ruby: Составные данные/i);
    //   expect(elements.modalDescription).toHaveTextContent(/Цель: Рассмотреть рациональные числа как новый пример абстракции на основе пар чисел./);
    //   expect(elements.modalLink).toHaveAttribute('href', /https:\/\/ru.hexlet.io\/courses\/ruby-compound-data\/lessons\/rational\/theory_unit/);
  
    // });
  });


  
  // test('add invalid rss', async () => {
  //   nock(url.mainLinkProxy)
  //     .persist()
  //     .defaultReplyHeaders(defaultReplyHeaders)
  //     .get('/get')
  //     .query({ url: url.rssLinkWrong })
  //     .reply(200, 'wronge-response');

  //   await userEvent.type(elements.formInput, url.rssLinkWrong);
  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveValue(url.rssLinkWrong);
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).not.toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).toBeEmptyDOMElement();
  //     expect(elements.postsList).toBeEmptyDOMElement();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('Ресурс не содержит валидный RSS');
  //   });
  // });

  // test('add one valid rss', async () => {
  //   nock(url.mainLinkProxy)
  //     .persist()
  //     .defaultReplyHeaders(defaultReplyHeaders)
  //     .get('/get')
  //     .query({ url: url.rssLink1 })
  //     .reply(200, dataRss1);

  //   await userEvent.type(elements.formInput, url.rssLink1);

  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveFocus();
  //     expect(elements.formInput).not.toHaveValue();
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).not.toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).not.toBeEmptyDOMElement();
  //     expect(elements.postsList).not.toBeEmptyDOMElement();
  //     expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Посты/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
  //   });
  // });

  // test('add two already exists rss', async () => {
  //   await userEvent.type(elements.formInput, url.rssLink1);

  //   nock(url.mainLinkProxy)
  //     .defaultReplyHeaders(defaultReplyHeaders)
  //     .persist()
  //     .get('/get')
  //     .query({ url: url.rssLink1 })
  //     .reply(200, dataRss1);

  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveFocus();
  //     expect(elements.formInput).not.toHaveValue();
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).not.toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).not.toBeEmptyDOMElement();
  //     expect(elements.postsList).not.toBeEmptyDOMElement();
  //     expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Посты/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
  //   });

  //   await userEvent.type(elements.formInput, url.rssLink1);
  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveValue(url.rssLink1);
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).not.toBeEmptyDOMElement();
  //     expect(elements.postsList).not.toBeEmptyDOMElement();
  //     expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Посты/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('RSS уже существует');
  //   });
  // });
  // test('add two valid rss', async () => {
  //   await userEvent.type(elements.formInput, url.rssLink1);

  //   nock(url.mainLinkProxy)
  //     .defaultReplyHeaders(defaultReplyHeaders)
  //     .persist()
  //     .get('/get')
  //     .query({ url: url.rssLink1 })
  //     .reply(200, dataRss1)
  //     .get('/get')
  //     .query({ url: url.rssLink2 })
  //     .reply(200, dataRss2);

  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveFocus();
  //     expect(elements.formInput).not.toHaveValue();
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).not.toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).not.toBeEmptyDOMElement();
  //     expect(elements.postsList).not.toBeEmptyDOMElement();
  //     expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Посты/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
  //   });

  //   await userEvent.type(elements.formInput, url.rssLink2);
  //   userEvent.click(elements.submitBtn);

  //   await waitFor(() => {
  //     expect(elements.formInput).toBeRequired();
  //     expect(elements.formInput).toHaveFocus();
  //     expect(elements.formInput).not.toHaveValue();
  //     expect(elements.formInput).toBeEnabled();
  //     expect(elements.formInput).not.toHaveClass('is-invalid');

  //     expect(elements.submitBtn).toBeEnabled();

  //     expect(elements.feedsList).not.toBeEmptyDOMElement();
  //     expect(elements.postsList).not.toBeEmptyDOMElement();
  //     expect(screen.getByText(/Фиды/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Новые уроки на Хекслете/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Практические уроки по программированию/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Посты/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Рациональные числа \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Реализация пар \/ Ruby: Составные данные/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Lorem ipsum feed for an interval of 1 years with 1 item\(s\)/i)).toBeInTheDocument();
  //     expect(screen.getByText(/This is a constantly updating lorem ipsum feed/i)).toBeInTheDocument();
  //     expect(screen.getByText(/Lorem ipsum 2021-01-01T00:00:00Z/i)).toBeInTheDocument();

  //     expect(elements.feedbackMessageBlock).not.toBeEmptyDOMElement();
  //     expect(elements.feedbackMessageBlock).not.toHaveClass('text-danger');
  //     expect(elements.feedbackMessageBlock).toHaveClass('text-success');
  //     expect(elements.feedbackMessageBlock).toHaveTextContent('RSS успешно загружен');
  //   });
  // });

  // test('invalid link', async () => {
  //   await userEvent.type(elements.formInput, 'wrong-email');

  //   userEvent.click(elements.submitBtn);

  //   expect(elements.formInput).toHaveClass('is-invalid');
  //   expect(elements.feedbackMessageBlock).toHaveClass('text-danger');
  //   expect(elements.feedbackMessageBlock).toHaveTextContent('Ссылка должна быть валидным URL');
  // });
});
