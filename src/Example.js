// @ts-check

// import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export default class Example {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.textContent = 'hello, world!!!!!!';
    console.log('ehu!1');
  }
}
