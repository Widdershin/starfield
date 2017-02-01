import {div, button, svg, h} from '@cycle/dom';
import xs from 'xstream';
import * as keycode from 'keycode';


function currentSlide (state) {
  return state.slides[state.currentSlide];
}

function nextSlide (state) {
  state.currentSlide += 1;
  state.targetPosition = currentSlide(state).position - 1;
  state.speed = 0.01;
  state.tweenStartPosition = state.currentPosition;
  return state;
}

function makeStarField (stars, scale, {width, height}) {
  return new Array(stars)
    .fill(0)
    .map(a => ({x: Math.random() * scale - width / 2, y: Math.random() * scale - height / 2}))
}

function makeStars (state) {
  const newStars = state.stars.concat(makeStarField(1, 0.001, {width: 1, height: 1}))

  state.stars = newStars;

  return state;
}

function setSpeed (state, speed) {
  state.speed = speed / innerWidth;

  state.speed = Math.max(state.speed, 0.001);

  return state;
}

function updateStarField (state, frame) {
  state.currentPosition += state.speed;

  const totalDistance = state.targetPosition - state.tweenStartPosition;
  const distanceToPosition = state.targetPosition - state.currentPosition;

  if (distanceToPosition < 0) {
    state.speed /= 1.1;
  } else if (distanceToPosition < totalDistance / 2) {
    state.speed /= 1.04;
  } else if (state.currentPosition < state.targetPosition) {
    state.speed *= 1.04;
  }


  const newStars = state.stars.map(star => {;
    if (star.x > 0.5 || star.x < -0.5 || star.y > 0.5 || star.y < -0.5) {
      star.x = Math.random() * 0.001 - 0.0005;
      star.y = Math.random() * 0.001 - 0.0005;
    }

    const speed = state.speed * 0.10;

    return {
      x: star.x * (1 + speed),
      y: star.y * (1 + speed)
    }
  });

  state.stars = newStars;

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

function App (sources) {
  const frame$ = sources.Time
    .animationFrames()

  const initialState = {
    stars: [],
    speed: 0,
    currentPosition: 0,
    targetPosition: 0,
    tweenStartPosition: 0,
    currentSlide: 0,
    slides: [
      {
        position: 0,
        text: ''
      },

      {
        position: 100,
        text: 'Hello Universe'
      },

      {
        position: 200,
        text: 'A journey through space and time'
      },

      {
        position: 500,
        text: 'Another slide for fun'
      }
    ]
  };

  const moveStars$ = frame$.map(frame => state => updateStarField(state, frame));

  const mouseMove$ = sources.DOM
    .select('document')
    .events('mousemove')
    .compose(sources.Time.throttleAnimation)

  const nextSlide$ = sources.DOM
    .select('document')
    .events('keydown')
    .filter(ev => ev.code === 'Space')
    .mapTo(nextSlide);

  const makeStars$ = nextSlide$
    .take(1)
    .map(() => sources.Time.periodic(5).take(600).mapTo(makeStars))
    .flatten();

  const reducer$ = xs.merge(
    moveStars$,
    makeStars$,
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
