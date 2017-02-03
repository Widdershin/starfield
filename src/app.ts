import {div, button, svg, h} from '@cycle/dom';
import xs from 'xstream';
import * as keycode from 'keycode';
import * as eases from 'eases';

function currentSlide (state) {
  return state.slides[state.currentSlide];
}

function nextSlide (state) {
  state.currentSlide += 1;
  state.targetPosition = currentSlide(state).position - 0.5;
  state.tweenStartPosition = state.currentPosition;
  state.tweenStartTime = state.time;
  const distance = state.targetPosition - state.currentPosition;
  state.tweenEndTime = state.time + distance * 10;
  return state;
}

function makeStarField (stars, scale, {width, height}) {
  return new Array(stars)
    .fill(0)
    .map(a => ({x: Math.random() * scale - width / 2, y: Math.random() * scale - height / 2}))
}

function setSpeed (state, speed) {
  state.speed = speed / innerWidth;

  state.speed = Math.max(state.speed, 0.001);

  return state;
}


function updateStarField (state, frame) {
  state.time += 16;

  if (state.stars.length < 300 && state.stars.length < Math.floor(state.currentPosition * 2)) {
    const starsToMake = Math.floor(state.currentPosition * 2 - state.stars.length);

    state.stars = state.stars.concat(makeStarField(starsToMake, 0.001, {width: 1, height: 1}))
  }

  let oldPosition = state.currentPosition;

  const totalDistance = state.targetPosition - state.tweenStartPosition;
  const distanceToPosition = state.targetPosition - state.currentPosition;

  if (state.currentPosition < state.targetPosition) {
    const animationTime = state.time - state.tweenStartTime;
    const progressRatio = animationTime / (state.tweenEndTime - state.tweenStartTime);
    const tweenDistance = state.targetPosition - state.tweenStartPosition;

    state.currentPosition = state.tweenStartPosition + tweenDistance * eases.quintInOut(progressRatio);
  }

  state.currentPosition += 0.0001;
  state.speed = Math.max(0.001, state.currentPosition - oldPosition);

  const speed = state.speed * 0.10;

  for (let i = 0; i < state.stars.length; i++) {
    const star = state.stars[i];

    if (star.x > 0.5 || star.x < -0.5 || star.y > 0.5 || star.y < -0.5) {
      star.x = Math.random() * 0.001 - 0.0005;
      star.y = Math.random() * 0.001 - 0.0005;
    }

    star.x *= (1 + speed);
    star.y *= (1 + speed);
  }

  return state;
}

function renderStars (stars, speed, {width, height}) {
  return stars.map((star, index) => renderStar(star, index, speed, {width, height}));
}

function renderStar (star, key, speed, {width, height}) {
  const progress = Math.pow(Math.sqrt(Math.abs(star.x) / 0.5 * Math.abs(star.y) / 0.5) * 100, 1.1) / 100;

  const beamMultiplier = 1.001 + progress * speed;

  return (
    h('line', {
      key,
      attrs: {
        x1: width / 2 + star.x * width,
        y1: height / 2 + star.y * height,
        x2: width / 2 + star.x * beamMultiplier * width,
        y2: height / 2 + star.y * beamMultiplier * height,
        width: 1,
        stroke: '#DDD'
      }
    })
  );
}

function renderSlides (slides, position, {width, height}) {
  return slides.map(slide => renderSlide(slide, position, {width, height}));
}

function renderSlide (slide, position, {width, height}) {
  const distance = slide.position - position;

  const scale = 1 / distance;

  if (scale < 0) {
    return h('text');
  }

  return (
    h('text', {
      attrs: {
        x: width / 2,
        y: height / 2,
        fill: 'white',
        'font-family': 'Catamaran',
        'font-size': 25 * scale,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'letter-spacing': `${1 * scale}px`
      }
    }, slide.text)
  );
}
const slides = [
  '',
  'My Cycle.js story',
  'A journey through space and time',
  'In the beginning',
  'One day I watched a talk',
  'And then I built cycle-time-travel',
  "But it wasn't good enough",
  "Thankfully Staltz",
  "Still very confused",
  "What about hot reloading?",
  "hmr api works but resets state",
  "cycle-restart cometh!",
  "now time travel is possible",
  "need to tame time"

].map((text, i) => ({position: i === 0 ? 0 : 500 + i * 200, text}))

function App (sources) {
  const frame$ = sources.Time
    .animationFrames()

  const initialState = {
    stars: [],
    speed: 0,
    time: 0,
    currentPosition: 0,
    targetPosition: 0,
    tweenStartPosition: 0,
    currentSlide: 0,
    slides
  };

  const moveStars$ = frame$.map(frame => state => updateStarField(state, frame));

  const nextSlide$ = sources.DOM
    .select('document')
    .events('keydown')
    .filter(ev => ev.code === 'Space')
    .mapTo(nextSlide);

  const reducer$ = xs.merge(
    moveStars$,
    nextSlide$
  );

  const state$ = reducer$.fold((stars, reducer: Function) => reducer(stars), initialState);

  return {
    DOM: state$.map(state => {
      const width = innerWidth;
      const height = innerHeight;

      return (
        h('svg', {attrs: {width, height}}, [
          ...renderStars(state.stars, state.speed, {width, height}),
          ...renderSlides(state.slides, state.currentPosition, {width, height})
        ])
      )
    })
  };
}

export {
  App
}
