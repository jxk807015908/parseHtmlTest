import {
  getAttrsMap,
  parseText,
  pluckModuleFunction,
} from "./utils";
import {
  processVPre,
  processFor,
  processIf,
  processIfConditions,
  processOnce,
  processKey,
  processRef,
  processSlotContent,
  processSlotOutlet,
  processComponent,
  processAttrs,
  processScopedSlot,
} from "./process";

// 标签开头正则
const START_TAG_REG = /^<([a-zA-Z_][\-a-zA-Z0-9_.]*)/;
// 标签静态属性正则
const ATTRS_REG = /^\s*([^\s<>\/"'=]+)(?:\s*=\s*(?:"([^"]+)"|'([^'])+'))?/;
// 标签动态属性正则
const DYNAMIC_ATTRS_REG = /^\s*((?:v-[\w-]+|:|@|\.|#)(\[[^\s<>\/"'=]+\]))(?:\s*=\s*(?:"([^"]+)"|'([^']+)'))?/;
// 开头标签结尾正则
const START_TAG_END_REG = /^\s*(\/?)>/;

// 闭合标签正则
const END_TAG_REG = /^<\/([a-zA-Z_\-]*)[^>]*>/;

function createASTElement(tag, attrs, parent) {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: getAttrsMap(attrs),
    parent,
    children: []
  }
}

function trimEndingWhitespace() { 

}

//编译HTML
function htmlParser(html = '', options = {}) {

  let stack = [];
  let inVPre = false;
  let inPre = false;
  let currentParent,root;

  let transforms = pluckModuleFunction(options.modules, 'transformNode')
  let preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  let postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  function cutHtml(num) {
    html = html.slice(num);
  }

  while (html) {
    // debugger
    // 匹配标签头
    let startMatch = html.match(START_TAG_REG);
    // console.log('startMatch', startMatch);
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
      // console.log('attrs', attrs);
      continue;
    }

    // 匹配尾标签
    let endMatch = html.match(END_TAG_REG);
    // console.log('endMatch', endMatch);
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
      value: match[2] || match[3] || '',
      name: match[1]
    }));
    start(tag, attrsList);
    unary && end(tag);
  }

  // 处理开头标签（涉及到节点栈的处理）， 如<p>
  function start(tag, attrs) {
    let el = createASTElement(tag, attrs, currentParent);

    preTransforms.forEach(preTransform=>{
      el = preTransform(el, options) || el;
    });

    if (!inVPre) {
      if (processVPre(el)) {
        inVPre = true;
      }
    }

    if (!inVPre) {
      processFor(el);
      processIf(el);
      processOnce(el);
    }


    if (tag === 'pre') {
      inPre = true;
    }

    !currentParent && (root = el);
    currentParent = el;
    stack.push(el);
  }

  // 处理结尾标签（涉及到节点栈的处理）， 如</p>
  function end(tag) {
    let el = stack.pop();
    currentParent = stack[stack.length - 1]

    if (!inVPre) {
      processKey(el);
      processRef(el);
      processSlotContent(el);
      processSlotOutlet(el);
      processComponent(el);
      transforms.forEach(transform=>{
        el = transform(el, options) || el;
      });
      processAttrs(el);
      processIfConditions(el);
      processScopedSlot(el, currentParent);
    }

    if (el.pre) {
      inVPre = false;
    }
    
    if (el.tag === 'pre') {
      inPre = false;
      // 外层仍有pre标签时，inPre依然应该是true
      let target = el;
      while (target) {
        if (el.tag === 'pre') {
          inPre = true;
          break
        }
      }
    }

    if (currentParent && !(el.elseif || el.else)) {
      if (!el.slotScope) {
        currentParent.children.push(el);
      }
      el.parent = currentParent
    }
    postTransforms.forEach(postTransform=>{
      postTransform(el, options);
    });
  }

  // 处理文本节点（涉及到节点栈的处理）
  function chars(text) {
    if (currentParent) {
      let t = text.trim();
      if (inVPre) {
        t && currentParent.children.push({
          text
        });
      } else if (inPre) {
        let res = parseText(text);
        currentParent.children.push({
          type: res.expression ? 2 : 3,
          ...res
        });
      } else {
        let res;
        t && (res = parseText(text)) && currentParent.children.push({
          type: res.expression ? 2 : 3,
          ...res
        });
      }
    }
  }

  return root;
}


export default htmlParser;