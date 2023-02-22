import { createApp, reactive } from 'https://esm.sh/petite-vue';
import confetti from 'https://esm.sh/canvas-confetti';
import utils from './esm/utils.js';
import style from './esm/style.js';
import prefer from './esm/prefer.js';
import query from './esm/query.js';
import storage from './esm/localStorage.js';

const STORAGE_KEY = `txt-todo-${query.file || 'example'}`;
const store = storage.fetch(STORAGE_KEY);

const items = reactive([]);

const App = {
  promptMessage: '',
  filePath: store.filePath,
  async init() {
    if (!query.isSave) {
      await this.parseTxt(query.file);
      this.updateSiteTitle();
      return storage.delete(STORAGE_KEY);
    }
    if (!store.items?.length) await this.parseTxt(query.file);
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
  async parseTxt(path) {
    const txt = await this.fetchTxt(path);

    for (const paragraph of txt.split('\n\n')) {
      if (!paragraph.trim() || paragraph.startsWith('//')) continue;
      const data = { title: '', descriptions: [], tasks: [] };

      paragraph
        .split('\n')
        .filter(p => p.trim())
        .forEach((line, lineIdx) => {
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
    const examplePath = `${root}/example.txt`;

    let res;
    let txtPath = path ? this.formatPath(root, path) : examplePath;
    try {
      res = await fetch(txtPath);
      if (!query.file) this.promptMessage = '未指定檔案';
    } catch (error) {
      // blocked
      txtPath = examplePath;
      res = await fetch(txtPath);
      this.promptMessage = '檔案抓取失敗';
    }
    // not found
    if (!res.ok) {
      txtPath = examplePath;
      res = await fetch(txtPath);
      this.promptMessage = '找不到檔案';
    }

    this.filePath = `~${txtPath.replace(root, '')}`;

    const text = await res.text();
    return text.trim()
      ? text
      : `
        沒有顯示內容？
        檢查 ${txtPath} 檔案
        參考 ${examplePath} 檔案，加入待辦事項
        開啟新視窗，以當前不帶有「autosave」查詢字串的網址載入網頁
        如果想開啟自動儲存功能，在網址中加入「autosave」查詢字串再重新載入
    `;
  },
  formatPath(root, path) {
    if (path.startsWith('http'))
      return path.split(' ').join('+').replace('+', '?').replaceAll('+', '&');

    let txtPath = '';
    if (!path.startsWith(root) || !path.startsWith(root.replace('/', '')))
      txtPath += root;
    if (!path.startsWith('/')) txtPath += '/';
    txtPath += path;
    if (!txtPath.endsWith('.txt')) txtPath += '.txt';
    return '/' + txtPath
      .split('/')
      .filter(split => split.trim())
      .join('/')
      .replace(root.repeat(2), root);
  },
  updateSiteTitle() {
    document.title = this.filePath
      .split('/')
      .at(-1)
      .split('_')
      .map(str => utils.capitalizeFirstLetter(str))
      .join(' ')
      .replace('.txt', '');
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

createApp({ ...App, items, style, prefer, query }).mount();

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
