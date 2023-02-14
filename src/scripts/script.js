import { createApp } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import items from './esm/items.js';

const App = {
  init() {
    for (const item of items) {
      item.steps = item.steps
        .split('，')
        .map(step => ({ step, completed: false }));
    }
  },
  completeStep(item, id) {
    if (document.querySelector('canvas')) return;
    if (id > 0 && !item.steps[id - 1].completed) return;

    if (
      id !== item.steps.length - 1 &&
      item.steps[id].completed &&
      !item.steps[id + 1].completed
    )
      return (item.steps[id].completed = false);

    item.steps[id].completed = true;

    if (item.steps.every(step => step.completed)) {
      confetti();
      setTimeout(() => {
        for (const step of item.steps) step.completed = false;
      }, 3000);
    }
  },
  setProgress() {
    if (typeof items[0].steps === 'string') return;
    for (const item of items) {
      item.progress = utils.getPercentage(
        item.steps.filter(step => step.completed).length,
        item.steps.length
      );
    }
  },
};

createApp({ ...App, items, utils }).mount();
