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

const STORAGE_KEY = `txt-todo${fetchFile}`;
const store = storage.fetch(STORAGE_KEY);

const items = reactive([]);

const App = {
  promptMessage: '',
  filePath: store.filePath || fetchFile,
  async init() {
    if (!query.isSave) {
      await this.parseTxt();
      this.updateSiteTitle();
      return storage.delete(STORAGE_KEY);
    }
    if (!store.items?.length) await this.parseTxt();
    else {
      for (const storeItem of store.items) {
        if (query.isOpen) storeItem.open = true;
        if (query.isClose) storeItem.open = false;
        if (storeItem.tasks.every(task => task.completed))
          query.isCycle
            ? this.reset(storeItem)
            : (storeItem.tasks.at(-1).editable = true);
        if (!query.isCycle) storeItem.completeTimes = 0;
        items.push(storeItem);
      }
    }
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
          editable: taskIdx === 0,
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
    if (item.tasks.every(task => task.completed)) {
      this.confetti(3);
      setTimeout(() => {
        if (query.isCycle) return this.reset(item);
        item.tasks.at(-1).editable = true;
      }, 3000);
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

if (query.isClose) {
  window.onscroll = () => {
    const sectionEls = Array.from(document.querySelectorAll('section'));
    sectionEls.forEach((sectionEl, idx) => {
      if (!utils.isVisible(sectionEl)) App.toggleOpen(items[idx], false);
    });
  };
}
