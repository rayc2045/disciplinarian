import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';

import localStorage from './esm/localStorage.js';
const STORAGE_KEY = 'discipline-todo';

const param = utils.getQueryParams(); // 'open', 'autoclose', 'autosave'
const items = reactive([]);

const App = {
  async init() {
    const store = localStorage.fetch(STORAGE_KEY);
    if (param.hasOwnProperty('autosave') && store.length) {
      store.forEach(item => items.push(item));
      if (param.hasOwnProperty('autoclose'))
        return items.forEach(item => (item.open = false));
      if (param.hasOwnProperty('open'))
        items.forEach(item => (item.open = true));
      return;
    }
    localStorage.delete(STORAGE_KEY);

    const txt = await fetch('/data/todo.txt').then(res => res.text());
    txt.split('\n\n').forEach((paragraph, idx) => {
      // parse txt
      const data = { title: '', descriptions: [], tasks: [] };
      paragraph.split('\n').forEach((line, lineIdx) => {
        if (lineIdx === 0) return (data.title = line);
        if (line.startsWith('-'))
          return data.descriptions.push(line.replace('- ', ''));
        data.tasks.push(line);
      });
      // init items
      items[idx] = {
        title: data.title,
        open: param.hasOwnProperty('open') && !param.hasOwnProperty('autoclose'),
        completeTimes: 0,
        progress: 0,
        descriptions: data.descriptions,
        tasks: data.tasks.map(task => ({
          task,
          completed: false,
          editable: false,
        })),
      };
    });
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
      // set localStorage
      if (param.hasOwnProperty('autosave'))
        localStorage.save(STORAGE_KEY, items);
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

createApp({ ...App, items }).mount();

if (param.hasOwnProperty('autoclose')) {
  window.onscroll = () => {
    const sectionEls = Array.from(document.querySelectorAll('section'));
    sectionEls.forEach((sectionEl, idx) => {
      if (!utils.isVisible(sectionEl)) items[idx].open = false;
    });
  };
}
