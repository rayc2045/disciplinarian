export default {
  getQueryParams(url = window.location.href) {
    const urlSearch = url.split('?')[1];
    const urlSearchParams = new URLSearchParams(urlSearch);
    return Object.fromEntries(urlSearchParams.entries());
  },
  getPercentage(num1, num2) {
    return Math.floor((num1 / num2) * 100);
  },
};
