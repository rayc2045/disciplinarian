import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';

const items = reactive([]);
/*
items = [
  {
    title: '...',
    open: false,
    completeTimes: 0,
    progress: 0,
    descriptions: []
    tasks: [
      { task: '...', completed: false, editable: false },
      { task: '...', completed: false, editable: false },
      { task: '...', completed: false, editable: false },
    ]
  },
]
*/

const App = {
  async init() {
    const txt = await fetch('/data/todo.txt').then(res => res.text());
    for (const paragraph of txt.split('\n\n')) {
      const data = { title: '', descriptions: [], tasks: [] };
      paragraph.split('\n').forEach((p, idx) => {
        if (idx === 0) return (data.title = p);
        if (p.startsWith('-'))
          return data.descriptions.push(p.replace('- ', ''));
        data.tasks.push(p);
      });
      items.push(data);
    }
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
    for (const item of items) {
      // set progress
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
      item.tasks.at(-1).editable = false;
      this.confetti(3);
      setTimeout(() => {
        item.completeTimes++;
        for (const task of item.tasks) task.completed = false;
        item.tasks[0].editable = true;
      }, 3000);
    }
  },
  confetti(times = 0) {
    confetti();
    if (times > 1) this.confetti(times - 1);
  },
};

createApp({ ...App, items, utils }).mount();
