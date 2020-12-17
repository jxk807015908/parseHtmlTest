const START_TAG_REG = /^<([a-zA-Z_][\-a-zA-Z0-9_.]*)/;
const ATTRS_REG = /^\s*([^\s<>\/"'=]+)(?:\s*=\s*(("[^"]+")|('[^']+')))?/;
const DYNAMIC_ATTRS_REG = /^\s*((?:v-[\w-]+|:|@|\.|#)(\[[^\s<>\/"'=]+\]))(?:\s*=\s*(("[^"]+")|('[^']+')))?/;
const START_TAG_END_REG = /^\s*(\/)?>/;

const END_TAG_REG = /^<\/([a-zA-Z_\-]*)[^>]*>/;
function htmlParser(html = '') {

  let stack = [];

  function cutHtml(num) {
    html = html.slice(num);
  }

  while (html) {
    // debugger
    // 匹配标签头
    let startMatch = html.match(START_TAG_REG);
    console.log('startMatch', startMatch);
    if (startMatch) {
      cutHtml(startMatch[0].length);
      let tagName = startMatch[1];
      let attrs = [];
      let attr;
      let end;
      while (!(end = html.match(START_TAG_END_REG)) && (attr = html.match(ATTRS_REG) || html.match(DYNAMIC_ATTRS_REG))) {
        attrs.push(attr);
        cutHtml(attr[0].length);
      }
      stack.push({
        tagName,
        attrs
      });
      cutHtml(end[0].length);
      console.log('attrs', attrs);
      continue;
    }

    // 匹配尾标签
    let endMatch = html.match(END_TAG_REG);
    console.log('endMatch', endMatch);
    if (endMatch) {
      cutHtml(endMatch[0].length);
      let tagName = endMatch[1];
      stack.push({
        tagName,
      });
      continue;
    }

    // 匹配文本
    let rest = '';
    while (
        html &&
        !START_TAG_REG.test(html) &&
        !END_TAG_REG.test(html)
        ) {
      let index = html.indexOf('<');
      if (index !== -1) {
        rest += html.slice(0, index);
        cutHtml(index);
      } else {
        rest += html;
        html = '';
      }
    }
    stack.push({
      text: rest
    })
  }
  console.log(stack);
}
export default htmlParser;