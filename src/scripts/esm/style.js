export default {
  group(style, to) {
    return `{${style
      .trim()
      .split(' ')
      .filter(s => s.length)
      .map(s => s.replaceAll('\n', ''))
      .join(';')}}${to}`;
  },
  darkTheme: {
    color: 'color:#eee',
    bg: 'bg:#151515',
    neumorphism: {
      flat: 'box-shadow:10px|10px|20px|black,-10px|-10px|20px|#222',
      pressed: 'box-shadow:inset|10px|10px|20px|black,inset|-10px|-10px|20px|#222',
    },
  },
  lightTheme: {
    color: 'color:#151515',
    bg: 'bg:whitesmoke',
    neumorphism: {
      flat: 'box-shadow:10px|10px|20px|#DADADA,-10px|-10px|20px|white',
      pressed: 'box-shadow:inset|10px|10px|20px|#DADADA,inset|-10px|-10px|20px|white',
    },
  },
  absoluteCenter: 'position:absolute left:50% top:50% translate(-50%,-50%)',
  flexCenter: 'flex justify-content:center align-items:center',
  hidden: 'max-height:0px overflow:hidden',
  truncate: 'max-width:100% white-space:nowrap overflow:hidden text-overflow:ellipsis',
};
