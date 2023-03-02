export default {
  group(style, to) {
    return `{${style
      .trim()
      .split(' ')
      .filter(s => s.length)
      .map(s => s.replaceAll('\n', ''))
      .join(';')}}${to}`;
  },
  darkTheme: 'color:#eee bg:#111',
  lightTheme: 'color:#111 bg:whitesmoke',
  hidden: 'max-height:0px overflow:hidden',
  truncate: 'max-width:100% white-space:nowrap overflow:hidden text-overflow:ellipsis',
};
