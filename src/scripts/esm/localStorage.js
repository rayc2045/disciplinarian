export default {
  fetch(storageKey) {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  },
  save(storageKey, data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  },
  delete(storageKey) {
    localStorage.removeItem(storageKey);
  },
};
