class CodegenState {
  constructor() {
    this.staticRenderFns = [];
  }
}

export default function generate(ast, options) {
  let state = new CodegenState();
  let code = genElement(ast, state);
  return {
    render: `with(this) {return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

function genElement(el, state) {
  let attrs = genData(el);
  let children = genChildren(el);
  return `_c('${el.tag}', ${attrs}${children ? `,${children}` : ''})`
}

function genNode(el, state) {
  if (el.type === 3 && el.isComment) {
    return genComment(el);
  } else if (el.type === 1) {
    return genElement(el, state);
  } else {
    return genText(el);
  }
}

function genComment(el) {
  return `_e(${JSON.stringify(el.text)})`;
}

function genText(el) {
  return `_v(${el.type === 2 ? el.expression : JSON.stringify(el.text)})`;
}

function genChildren(el = {}, state) {
  if (el.children && el.children.length) {
    let res = '[';
    el.children.map(child=>{
      res += genNode(child, state) + ',';
    });
    res = res.slice(0, -1) + ']';
    return res;
  }
}

function genData(node) {
  let objStr = '{';
  if (node.ref) {
    objStr += `ref:${node.ref}`;
  }
  if (node.key) {
    objStr += `key:${node.key}`;
  }
  objStr += '}';
  return objStr;
}