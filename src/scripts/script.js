import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';

import storage from './esm/localStorage.js';
const STORAGE_KEY = 'discipline-todo';

const param = utils.getQueryParams();
const items = reactive([]);

const App = {
  isSave: param.hasOwnProperty('autosave'),
  isOpen: param.hasOwnProperty('open') && !param.hasOwnProperty('autoclose'),
  async init() {
    const store = storage.fetch(STORAGE_KEY);
    if (this.isSave && store.length) {
      for (const storeItem of store) {
        storeItem.open = this.isOpen;
        if (storeItem.tasks.every(task => task.completed)) {
          storeItem.completeTimes++;
          storeItem.progress = 0;
          for (const task of storeItem.tasks) task.completed = false;
        }
        items.push(storeItem);
      }
      return;
    }

    storage.delete(STORAGE_KEY);

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
        open: this.isOpen,
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
      const completedTasksNum = item.tasks.filter(
        task => task.completed
      ).length;
      const lastCompleteId = completedTasksNum - 1;
      // set progress
      item.progress = utils.getProgress(completedTasksNum, item.tasks.length);
      // set editable
      for (const task of item.tasks) task.editable = false;
      if (lastCompleteId < 0) item.tasks[0].editable = true;
      else {
        item.tasks[lastCompleteId].editable = true;
        if (completedTasksNum < item.tasks.length)
          item.tasks[lastCompleteId + 1].editable = true;
        else item.tasks.at(-1).editable = false;
      }
    }
  },
  completeTask(item, taskId) {
    const task = item.tasks[taskId];
    if (task.editable) {
      task.completed = !task.completed;
      if (this.isSave) storage.save(STORAGE_KEY, items);
    }
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
