import utils from './utils.js';
const param = utils.getQueryParams();

export default {
  file: param.file,
  isSave: param.hasOwnProperty('autosave'),
  isOpen: param.hasOwnProperty('open') && !param.hasOwnProperty('autoclose'),
  isClose: param.hasOwnProperty('autoclose'),
  isCycle: param.hasOwnProperty('cycle'),
  isOutlined: param.hasOwnProperty('outlined') && !param.hasOwnProperty('filled'),
  isOrdered: !param.hasOwnProperty('unordered'),
};
