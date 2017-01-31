import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';

import {App} from './app';

const drivers = {
  DOM: makeDOMDriver('.app'),
  Time: timeDriver
};

run(App, drivers);
