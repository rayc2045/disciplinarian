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
      // set editable
      for (const stepId in item.steps) item.steps[stepId].editable = false;
      const completedStepsNum = item.steps.filter(
        step => step.completed
      ).length;
      const lastCompleteId = completedStepsNum - 1;
      if (completedStepsNum === item.steps.length) item.steps[lastCompleteId].editable = false;
      else if (lastCompleteId < 0) item.steps[0].editable = true;
      else {
        if (lastCompleteId > 1) item.steps[lastCompleteId - 1].editable = false;
        item.steps[lastCompleteId].editable = true;
        if (completedStepsNum < item.steps.length)
          item.steps[lastCompleteId + 1].editable = true;
      }
    }
  },
  completeStep(item, id) {
    // if (id > 0 && !item.steps[id - 1].completed) return;
    // if (
    //   id !== item.steps.length - 1 &&
    //   item.steps[id].completed &&
    //   !item.steps[id + 1].completed
    // )
    //   return (item.steps[id].completed = false);
    if (item.steps[id].editable)
      item.steps[id].completed = !item.steps[id].completed;

    if (item.steps.every(step => step.completed)) {
      confetti();
      setTimeout(() => {
        for (const step of item.steps) step.completed = false;
        item.completeTimes++;
      }, 3000);
    }
  },
};

createApp({ ...App, items, utils }).mount();
