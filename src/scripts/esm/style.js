export default {
  group(style, to) {
    return `{${style}}${to}`.replaceAll(' ', ';');
  },
};
