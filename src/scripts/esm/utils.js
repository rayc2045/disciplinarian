export default {
  getQueryParams(url = window.location.href) {
    const urlSearch = url.split('?')[1];
    const urlSearchParams = new URLSearchParams(urlSearch);
    return Object.fromEntries(urlSearchParams.entries());
  },
  getProgress(num1, num2) {
    return Math.floor((num1 / num2) * 100);
  },
  isVisible(el) {
    const elTop = ~-el.getBoundingClientRect().top;
    const elBottom = ~-el.getBoundingClientRect().bottom;
    return elTop < window.innerHeight && elBottom >= 0;
  },
};
