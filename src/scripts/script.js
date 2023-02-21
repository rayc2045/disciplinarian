import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import style from './esm/style.js';
import query from './esm/query.js';
import storage from './esm/localStorage.js';

const STORAGE_KEY = `discipline-todo-${query.file}`;

const items = reactive([]);

const App = {
  errorMessage: '',
  async init() {
    if (!query.isSave) {
      await this.parseTxt(query.file);
      return storage.delete(STORAGE_KEY);
    }
    const store = storage.fetch(STORAGE_KEY);
    if (!store.length) await this.parseTxt(query.file);
    else {
      for (const storeItem of store) {
        if (query.isOpen) storeItem.open = true;
        if (query.isClose) storeItem.open = false;
        if (storeItem.tasks.every(task => task.completed))
          this.reset(storeItem);
        items.push(storeItem);
      }
    }
    storage.save(STORAGE_KEY, items);
  },
  async parseTxt(path) {
    const txt = await this.fetchTxt(path);

    for (const paragraph of txt.split('\n\n')) {
      if (!paragraph.trim() || paragraph.startsWith('//')) continue;
      const data = { title: '', descriptions: [], tasks: [] };
      paragraph.split('\n').forEach((line, lineIdx) => {
        if (lineIdx === 0) return (data.title = line);
        if (line.startsWith('- '))
          return data.descriptions.push(line.replace('- ', ''));
        data.tasks.push(line);
      });

      items.push({
        title: data.title,
        open: query.isOpen,
        completeTimes: 0,
        progress: 0,
        descriptions: data.descriptions,
        tasks: data.tasks.map((task, taskIdx) => ({
          task,
          completed: false,
          editable: taskIdx === 0,
        })),
      });
    }
  },
  async fetchTxt(path) {
    const root = '/public/txt';

    let txtPath = '';
    if (path.startsWith('http'))
      txtPath = path
        .split(' ')
        .join('+')
        .replace('+', '?')
        .replaceAll('+', '&');
    else {
      if (!path.startsWith(root) || !path.startsWith(root.replace('/', '')))
        txtPath += root;
      if (!path.startsWith('/')) txtPath += '/';
      txtPath += path;
      txtPath = txtPath.replace(root.repeat(2), root);
      if (!txtPath.endsWith('.txt')) txtPath += '.txt';
    }

    let res;
    try {
      res = await fetch(txtPath);
    } catch (error) {
      this.errorMessage = '檔案抓取失敗';
      res = await fetch(`${root}/example.txt`);
    }
    if (!res.ok) {
      this.errorMessage = '找不到檔案';
      res = await fetch(`${root}/example.txt`);
    }
    return await res.text();
  },
  toggleOpen(item, open = !item.open) {
    item.open = open;
    if (query.isSave) storage.save(STORAGE_KEY, items);
  },
  toggleCompleted(item, taskId) {
    const task = item.tasks[taskId];
    if (!task.editable) return;
    task.completed = !task.completed;
    this.update(item);
    if (item.tasks.every(task => task.completed)) {
      this.confetti(3);
      setTimeout(() => this.reset(item), 3000);
    }
  },
  update(item) {
    // update 'progress' and 'editable'
    const completedTasksNum = item.tasks.filter(task => task.completed).length;
    const lastCompleteId = completedTasksNum - 1;
    item.progress = utils.getProgress(completedTasksNum, item.tasks.length);
    for (const task of item.tasks) task.editable = false;
    if (completedTasksNum === 0) item.tasks[0].editable = true;
    else {
      item.tasks[lastCompleteId].editable = true;
      if (completedTasksNum < item.tasks.length)
        item.tasks[lastCompleteId + 1].editable = true;
      else item.tasks.at(-1).editable = false;
    }
    if (query.isSave) storage.save(STORAGE_KEY, items);
  },
  reset(item) {
    item.completeTimes++;
    for (const task of item.tasks) task.completed = false;
    this.update(item);
  },
  confetti(times = 0) {
    confetti();
    if (times > 1) this.confetti(times - 1);
  },
};

createApp({ ...App, items, query, style }).mount();

window.onload = () => {
  document.body.removeAttribute('style');
  document.querySelector('#loader').remove();
};

if (query.isClose) {
  window.onscroll = () => {
    const sectionEls = Array.from(document.querySelectorAll('section'));
    sectionEls.forEach((sectionEl, idx) => {
      if (!utils.isVisible(sectionEl)) App.toggleOpen(items[idx], false);
    });
  };
}
