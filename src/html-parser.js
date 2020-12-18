// 标签开头正则
const START_TAG_REG = /^<([a-zA-Z_][\-a-zA-Z0-9_.]*)/;
// 标签静态属性正则
const ATTRS_REG = /^\s*([^\s<>\/"'=]+)(?:\s*=\s*(("[^"]+")|('[^']+')))?/;
// 标签动态属性正则
const DYNAMIC_ATTRS_REG = /^\s*((?:v-[\w-]+|:|@|\.|#)(\[[^\s<>\/"'=]+\]))(?:\s*=\s*(("[^"]+")|('[^']+')))?/;
// 开头标签结尾正则
const START_TAG_END_REG = /^\s*(\/?)>/;

// 闭合标签正则
const END_TAG_REG = /^<\/([a-zA-Z_\-]*)[^>]*>/;

function createASTElement(tag, attrs, parent) {
  return {
    tag,
    attrsList: attrs,
    parent,
    children: []
  }
}

//编译HTML
function htmlParser(html = '') {

  let stack = [];
  let inVPre = false;
  let currentParent,root;

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
      let tag = startMatch[1];
      let attrs = [];
      let attr;
      let end;
      while (!(end = html.match(START_TAG_END_REG)) && (attr = html.match(ATTRS_REG) || html.match(DYNAMIC_ATTRS_REG))) {
        attrs.push(attr);
        cutHtml(attr[0].length);
      }
      handleStartTag(tag, attrs, !!end[1]);
      cutHtml(end[0].length);
      console.log('attrs', attrs);
      continue;
    }

    // 匹配尾标签
    let endMatch = html.match(END_TAG_REG);
    console.log('endMatch', endMatch);
    if (endMatch) {
      cutHtml(endMatch[0].length);
      let tag = endMatch[1];
      end(tag);
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
    chars(rest);
  }
  // console.log(stack);

  // 对开头标签的进一步处理
  function handleStartTag(tag, attrs, unary) {
    // 处理属性
    let attrsList = attrs.map(match => ({
      value: match[2] || match[3],
      name: match[1]
    }));
    start(tag, attrsList);
    unary && end(tag);
  }

  // 处理开头标签（涉及到节点栈的处理）， 如<p>
  function start(tag, attrs) {
    let el = createASTElement(tag, attrs, currentParent);
    !currentParent && (root = el);
    currentParent = el;
    stack.push(el);
  }

  // 处理结尾标签（涉及到节点栈的处理）， 如</p>
  function end(tag) {
    let el = stack.pop();
    currentParent = stack[stack.length - 1]
    if (currentParent) {
      currentParent.children.push(el);
    }
  }

  // 处理文本节点（涉及到节点栈的处理）
  function chars(text) {
    if (currentParent) {
      currentParent.children.push({
        text
      });
    }
  }

  return root;
}


export default htmlParser;