import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import todo from './esm/todo.js';
/*
todo = [
  {
    title: '',
    tasks: [ '...', '...', '...', ]
  },
]
*/

const items = reactive(todo);
/*
items = [
  {
    title: '...',
    open: false,
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
    const { open } = utils.getQueryParams();
    for (const item of items) {
      item.open = typeof open !== 'undefined';
      item.completeTimes = 0;
      item.tasks = item.tasks.map(task => ({
        task,
        completed: false,
        editable: false,
      }));
    }
  },
  update() {
    if (typeof items[0].tasks[0] === 'string') return;
    for (const item of items) {
      const completedTasksNum = item.tasks.filter(
        task => task.completed
      ).length;
      const lastCompleteId = completedTasksNum - 1;
      item.progress = utils.getPercentage(completedTasksNum, item.tasks.length);
      // set editable
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
  completeTask(item, taskId) {
    const task = item.tasks[taskId];
    if (task.editable) task.completed = !task.completed;
    if (item.tasks.every(task => task.completed)) {
      this.confetti(3);
      setTimeout(() => {
        item.completeTimes++;
        for (const task of item.tasks) task.completed = false;
      }, 3000);
    }
  },
  confetti(times = 0) {
    confetti();
    if (times > 1) this.confetti(times - 1);
  },
};

createApp({ ...App, items, utils }).mount();
