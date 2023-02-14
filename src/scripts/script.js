import { createApp } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import items from './esm/items.js';

const App = {
  items,
  init() {
    for (const item of items) {
      item.steps = item.step
        .split('，')
        .map(step => ({ step, completed: false }));
      delete item.step;
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
};

createApp(App).mount();
