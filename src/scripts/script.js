import { createApp } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import items from './esm/items.js';

const App = {
  init() {
    for (const item of items) {
      item.completeTimes = 0;
      item.steps = item.steps.split('，').map(step => ({
        step,
        completed: false,
        editable: false,
      }));
    }
  },
  update() {
    if (typeof items[0].steps === 'string') return;
    for (const item of items) {
      item.progress = utils.getPercentage(
        item.steps.filter(step => step.completed).length,
        item.steps.length
      );

      const completedStepsNum = item.steps.filter(
        step => step.completed
      ).length;
      const lastCompleteId = completedStepsNum - 1;

      for (const step of item.steps) step.editable = false;
      if (lastCompleteId < 0) item.steps[0].editable = true;
      else {
        item.steps[lastCompleteId].editable = true;
        if (completedStepsNum < item.steps.length)
          item.steps[lastCompleteId + 1].editable = true;
        if (item.steps.at(-1).completed) item.steps.at(-1).editable = false;
      }
    }
  },
  completeStep(item, id) {
    if (item.steps[id].editable)
      item.steps[id].completed = !item.steps[id].completed;

    if (item.steps.every(step => step.completed)) {
      item.steps.at(-1).editable = false;
      confetti();
      setTimeout(() => {
        item.completeTimes++;
        for (const step of item.steps) step.completed = false;
        item.steps[0].editable = true;
      }, 3000);
    }
  },
};

createApp({ ...App, items, utils }).mount();
