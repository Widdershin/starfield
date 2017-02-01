import {div, button, svg, h} from '@cycle/dom';
import xs from 'xstream';

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
        stroke: 'white'
      }
    })
  );
}

function App (sources) {
  const frame$ = sources.Time
    .animationFrames()

  const initialState = {
    stars: [],
    speed: 1
  };

  const moveStars$ = frame$.map(frame => state => updateStarField(state, frame));
  const makeStars$ = sources.Time.periodic(5).take(600).mapTo(makeStars);

  const mouseMove$ = sources.DOM
    .select('document')
    .events('mousemove')
    .compose(sources.Time.throttleAnimation)

  const setSpeed$ = mouseMove$
    .map(ev => state => setSpeed(state, ev.clientX));

  const reducer$ = xs.merge(
    moveStars$,
    makeStars$,
    setSpeed$
  );

  const state$ = reducer$.fold((stars, reducer: Function) => reducer(stars), initialState);

  return {
    DOM: state$.map(state => {
      const width = innerWidth;
      const height = innerHeight;

      return (
        h('svg', {attrs: {width, height}}, [
          ...renderStars(state.stars, state.speed, {width, height})
          //h('text', {attrs: {x: width / 2, y: height / 2, fill: 'white', 'font-family': 'Impact', 'font-size': 25, 'text-anchor': 'middle'}}, 'A journey through space and time')
        ])
      )
    })
  };
}

export {
  App
}
