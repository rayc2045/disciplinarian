import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import example from './esm/example.js';

const items = reactive(example);
/*
items = [
  {
    title: '...',
    completeTimes: 0,
    progress: 0,
    tasks: [
      { task: '...', completed: false, editable: false },
      { task: '...', completed: false, editable: false },
      { task: '...', completed: false, editable: false },
    ]
  },
]
*/

const App = {
  init() {
    for (const item of items) {
      item.completeTimes = 0;
      item.tasks = item.tasks.split('；').map(task => ({
        task,
        completed: false,
        editable: false,
      }));
    }
  },
  update() {
    if (typeof items[0].tasks === 'string') return;
    for (const item of items) {
      item.progress = utils.getPercentage(
        item.tasks.filter(task => task.completed).length,
        item.tasks.length
      );

      const completedTasksNum = item.tasks.filter(
        task => task.completed
      ).length;
      const lastCompleteId = completedTasksNum - 1;

      for (const task of item.tasks) task.editable = false;
      if (lastCompleteId < 0) item.tasks[0].editable = true;
      else {
        item.tasks[lastCompleteId].editable = true;
        if (completedTasksNum < item.tasks.length)
          item.tasks[lastCompleteId + 1].editable = true;
        if (item.tasks.at(-1).completed) item.tasks.at(-1).editable = false;
      }
    }
  },
  completeTask(item, id) {
    if (item.tasks[id].editable)
      item.tasks[id].completed = !item.tasks[id].completed;

    if (item.tasks.every(task => task.completed)) {
      item.tasks.at(-1).editable = false;
      confetti();
      setTimeout(() => {
        item.completeTimes++;
        for (const task of item.tasks) task.completed = false;
        item.tasks[0].editable = true;
      }, 3000);
    }
  },
};

createApp({ ...App, items, utils }).mount();
