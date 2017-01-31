import {div, button, svg, h} from '@cycle/dom';
import xs from 'xstream';

function makeStarField (stars, scale, {width, height}) {
  return new Array(stars)
    .fill(0)
    .map(a => ({x: Math.random() * scale - width / 2, y: Math.random() * scale - height / 2}))
}

function makeStars (stars) {
  return stars.concat(makeStarField(5, 0.001, {width: 1, height: 1}))
}

function updateStarField (stars, frame) {
  return stars.map(star => {
    if (star.x > 0.5 || star.x < -0.5 || star.y > 0.5 || star.y < -0.5) {
      star.x = Math.random() * 0.001 - 0.0005;
      star.y = Math.random() * 0.001 - 0.0005;
    }

    return {
      x: star.x * 1.05,
      y: star.y * 1.05
    }
  });
}

function renderStars (stars, {width, height}) {
  return stars.map((star, index) => renderStar(star, index, {width, height}));
}

function renderStar (star, key, {width, height}) {
  const progress = 1 + Math.pow(Math.sqrt(Math.abs(star.x) / 0.5 * Math.abs(star.y) / 0.5) * 100, 1.1) / 100;

  return (
    h('line', {
      key,
      attrs: {
        x1: width / 2 + star.x * width,
        y1: height / 2 + star.y * height,
        x2: width / 2 + star.x * width * progress,
        y2: height / 2 + star.y * height * progress,
        width: 1,
        stroke: 'white'
      }
    })
  );
}

function App (sources) {
  const frame$ = sources.Time
    .animationFrames()

  const stars = [];

  const moveStars$ = frame$.map(frame => stars => updateStarField(stars, frame));
  const makeStars$ = sources.Time.periodic(50).take(60).mapTo(makeStars);

  const reducer$ = xs.merge(
    moveStars$,
    makeStars$
  );

  const stars$ = reducer$.fold((stars, reducer: Function) => reducer(stars), stars);

  return {
    DOM: stars$.map(stars => {
      const width = innerWidth;
      const height = innerHeight;

      return (
        h('svg', {attrs: {width, height}}, [
          ...renderStars(stars, {width, height})
          //h('text', {attrs: {x: width / 2, y: height / 2, fill: 'white', 'font-family': 'Impact', 'font-size': 25, 'text-anchor': 'middle'}}, 'A journey through space and time')
        ])
      )
    })
  };
}

export {
  App
}
