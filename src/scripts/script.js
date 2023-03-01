import 'https://esm.sh/@master/css';
import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import style from './esm/style.js';
import prefer from './esm/prefer.js';
import query from './esm/query.js';
import storage from './esm/localStorage.js';

const ROOT = '/public/txt';
const exampleFile = `${ROOT}/example.txt`;
const fetchFile = query.file
  ? utils.formatFilePath(ROOT, query.file, 'txt')
  : exampleFile;

const STORAGE_KEY = `txt-todo${
  fetchFile.startsWith('http') ? '-' : ''
}${fetchFile}`;
const store = storage.fetch(STORAGE_KEY);

const items = reactive([]);

const App = {
  promptMessage: '',
  filePath: store.filePath || fetchFile,
  totalProgress: 0,
  async init() {
    if (!query.isSave) {
      await this.parseTxt();
      if (!query.isCycle) this.updateTotalProgress();
      this.updateSiteTitle();
      return storage.delete(STORAGE_KEY);
    }
    if (!store.items?.length) await this.parseTxt();
    else {
      for (const storeItem of store.items) {
        if (query.isOpen) storeItem.open = true;
        if (query.isClose) storeItem.open = false;
        if (!query.isCycle) storeItem.completeTimes = 0;
        if (!query.isStrict)
          for (const task of storeItem.tasks) task.editable = true;
        if (storeItem.tasks.every(task => task.completed)) {
          if (query.isCycle) this.reset(storeItem);
          else if (query.isStrict) storeItem.tasks.at(-1).editable = true;
        } else if (query.isStrict) {
          let minCompleted = storeItem.tasks.findIndex(task => !task.completed);
          if (minCompleted < 0) minCompleted = storeItem.tasks.length;
          storeItem.tasks.forEach(
            (task, idx) => (task.completed = idx < minCompleted)
          );
          this.update(storeItem);
        }
        items.push(storeItem);
      }
    }
    if (!query.isCycle) this.updateTotalProgress();
    this.updateSiteTitle();
    this.save();
  },
  async parseTxt() {
    const res = await utils.fetchText(fetchFile, exampleFile);
    if (!query.file) this.promptMessage = '未指定檔案';
    else if (res.status === 'Blocked') this.promptMessage = '檔案讀取失敗';
    else if (res.status === 'Not found') this.promptMessage = '找不到檔案';

    this.filePath = res.file;

    const content =
      res.text.trim() ||
      `
      沒有顯示內容？
      檢查 ${fetchFile} 檔案
      參考 ${exampleFile} 檔案，加入待辦事項
      開啟新視窗，以當前不帶有「autosave」查詢字串的網址載入網頁
      如果想開啟自動儲存功能，在網址中加入「autosave」查詢字串再重新載入
    `;

    for (const paragraph of content.split('\n\n')) {
      if (!paragraph.trim() || paragraph.startsWith('//')) continue;
      const data = { title: '', descriptions: [], tasks: [] };
      paragraph
        .split('\n')
        .filter(p => p.trim())
        .forEach((line, lineIdx) => {
          line = line.trim();
          if (lineIdx === 0) return (data.title = line);
          if (line.startsWith('-'))
            return data.tasks.push(line.replace('-', '').trim());
          data.descriptions.push(line);
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
          editable: taskIdx === 0 || !query.isStrict,
        })),
      });
    }
  },
  updateSiteTitle() {
    document.title = utils.getUppercaseFileName(this.filePath, 'txt');
  },
  toggleOpen(item, open = !item.open) {
    item.open = open;
    if (query.isSave) this.save();
  },
  toggleCompleted(item, taskId) {
    const task = item.tasks[taskId];
    if (!task.editable) return;
    task.completed = !task.completed;
    this.update(item);
    if (!query.isCycle) this.updateTotalProgress();

    if (item.tasks.every(task => task.completed)) {
      for (const task of item.tasks) task.editable = false;
      this.confetti(3);
      setTimeout(() => {
        if (query.isCycle) {
          if (!query.isStrict)
            for (const task of item.tasks) task.editable = true;
          return this.reset(item);
        }
        if (query.isStrict) return (item.tasks.at(-1).editable = true);
        for (const task of item.tasks) task.editable = true;
      }, 3000);
    }
  },
  updateTotalProgress() {
    let completedNum = 0;
    let total = 0;
    for (const item of items) {
      for (const task of item.tasks) {
        if (task.completed) completedNum++;
        total++;
      }
    }
    this.totalProgress = utils.getProgress(completedNum, total);
  },
  update(item) {
    // update progress
    const completedTasksNum = item.tasks.filter(task => task.completed).length;
    item.progress = utils.getProgress(completedTasksNum, item.tasks.length);
    // update editable
    if (query.isStrict) {
      for (const task of item.tasks) task.editable = false;
      if (!completedTasksNum) item.tasks[0].editable = true;
      else {
        const lastCompleteId = completedTasksNum - 1;
        item.tasks[lastCompleteId].editable = true;
        if (completedTasksNum < item.tasks.length)
          item.tasks[lastCompleteId + 1].editable = true;
      }
    }
    if (query.isSave) this.save();
  },
  reset(item) {
    item.completeTimes++;
    for (const task of item.tasks) task.completed = false;
    this.update(item);
  },
  save() {
    storage.save(STORAGE_KEY, {
      filePath: this.filePath,
      items,
    });
  },
  confetti(times = 0) {
    confetti();
    if (times > 1) this.confetti(times - 1);
  },
};

createApp({ ...App, items, utils, style, prefer, query }).mount();

window.onload = () => {
  document.body.removeAttribute('style');
  document.querySelector('#loader').remove();
};

let oldScrollY = window.scrollY;

window.onscroll = () => {
  const headerEl = document.querySelector('header');
  if (oldScrollY < window.scrollY) headerEl.style.top = '-8.5em';
  else if (!utils.isVisible(headerEl)) headerEl.style.top = '0px';
  oldScrollY = window.scrollY;

  if (!query.isClose) return;
  const sectionEls = Array.from(document.querySelectorAll('section'));
  sectionEls.forEach((sectionEl, idx) => {
    if (!utils.isVisible(sectionEl)) App.toggleOpen(items[idx], false);
  });
};
