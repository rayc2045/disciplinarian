import utils from './utils.js';
const param = utils.getQueryParams();
const queries = Object.keys(param).map(key => key.toLocaleLowerCase());

export default {
  file: param.file,
  isDark: queries.includes('dark') && !queries.includes('light'),
  isLight: queries.includes('light') && !queries.includes('dark'),
  is3D: queries.includes('3d'), // param.hasOwnProperty('3D')
  isSave: queries.includes('autosave'),
  isOpen: queries.includes('open') && !queries.includes('autoclose'),
  isClose: queries.includes('autoclose'),
  isList: queries.includes('list') && !queries.find(query => query.startsWith('check')),
  isOrdered: !queries.includes('unordered'),
  isOutlined: queries.includes('outlined') && !queries.includes('filled'),
  isStrict: !queries.includes('free'),
  isCycle: queries.includes('cycle'),
};
