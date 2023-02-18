import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';

import storage from './esm/localStorage.js';
const STORAGE_KEY = 'discipline-todo';

const param = utils.getQueryParams();
const query = {
  isSave: param.hasOwnProperty('autosave'),
  isOpen: param.hasOwnProperty('open') && !param.hasOwnProperty('autoclose'),
  isClose: param.hasOwnProperty('autoclose'),
};

const items = reactive([]);

const App = {
  async init() {
    const store = storage.fetch(STORAGE_KEY);
    if (query.isSave && store.length) {
      for (const storeItem of store) {
        if (query.isOpen) storeItem.open = true;
        if (query.isClose) storeItem.open = false;
        if (storeItem.tasks.every(task => task.completed))
          this.resetItem(storeItem);
        items.push(storeItem);
      }
      if (query.isSave) storage.save(STORAGE_KEY, items);
      return;
    }
    storage.delete(STORAGE_KEY);
    await this.parseTxt();
  },
  async parseTxt() {
    const txt = await fetch('/data/todo.txt').then(res => res.text());

    for (const paragraph of txt.split('\n\n')) {
      const data = { title: '', descriptions: [], tasks: [] };
      paragraph.split('\n').forEach((line, lineIdx) => {
        if (lineIdx === 0) return (data.title = line);
        if (line.startsWith('-'))
          return data.descriptions.push(line.replace('- ', ''));
        data.tasks.push(line);
      });

      items.push({
        title: data.title,
        open: query.isOpen,
        completeTimes: 0,
        progress: 0,
        descriptions: data.descriptions,
        tasks: data.tasks.map(task => ({
          task,
          completed: false,
          editable: false,
        })),
      });
    }
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
  toggleOpen(item) {
    item.open = !item.open;
    if (query.isSave) storage.save(STORAGE_KEY, items);
  },
  toggleCompleted(item, taskId) {
    const task = item.tasks[taskId];
    if (task.editable) {
      task.completed = !task.completed;
      if (query.isSave) storage.save(STORAGE_KEY, items);
    }
    if (item.tasks.every(task => task.completed)) {
      item.tasks.at(-1).editable = false;
      this.confetti(3);
      setTimeout(() => {
        this.resetItem(item);
        item.tasks[0].editable = true;
      }, 3000);
    }
  },
  resetItem(item) {
    item.completeTimes++;
    for (const task of item.tasks) task.completed = false;
  },
  confetti(times = 0) {
    confetti();
    if (times > 1) this.confetti(times - 1);
  },
};

createApp({ ...App, items }).mount();

if (query.isClose) {
  window.onscroll = () => {
    const sectionEls = Array.from(document.querySelectorAll('section'));
    sectionEls.forEach((sectionEl, idx) => {
      if (!utils.isVisible(sectionEl)) {
        items[idx].open = false;
        if (query.isSave) storage.save(STORAGE_KEY, items);
      }
    });
  };
}
