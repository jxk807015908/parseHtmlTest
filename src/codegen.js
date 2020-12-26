import {
  pluckModuleFunction,
} from "./utils";
class CodegenState {
  constructor(options) {
    this.staticRenderFns = [];
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData')
  }
}

export default function generate(ast, options) {
  let state = new CodegenState(options);
  let code = genElement(ast, state);
  return {
    render: `with(this) {return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

function genElement(el, state) {
  let attrs = genData(el, state);
  let children = genChildren(el, state);
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

function genData(el, state) {
  let objStr = '{';
  if (el.key) {
    objStr += `key:${el.key}`;
  }
  if (el.ref) {
    objStr += `,ref:${el.ref}`;
  }
  if (el.refInFor) {
    objStr += `,refInFor:${el.refInFor}`;
  }
  if (el.pre) {
    objStr += `,pre:${el.pre}`;
  }
  if (el.component) {
    objStr += `,tag:${el.tag}`;
  }
  state.dataGenFns.forEach(fn=>{
    objStr += fn(el, state)
  });
  if (el.attrs) {
    objStr += `,attrs:${genProps(el.attrs)}`;
  }
  if (el.props) {
    objStr += `,domProps:${genProps(el.props)}`;
  }
  // if (el.nativeEvents) {
  //   objStr += `nativeOn:${genProps(el.nativeEvents)}`;
  // }
  objStr += '}';
  return objStr;
}

// 生成属性代码
function genProps(attrs) {
  let staticAttrs = '';
  let dynamicAttrs = '';
  attrs.forEach(attr=>{
    if (attr.dynamic) {
      dynamicAttrs += `${attr.name},${attr.value},`;
    } else {
      staticAttrs += `'${attr.name}':${attr.value},`;
    }
  });
  staticAttrs = `{${staticAttrs.slice(0, -1)}}`;
  if (dynamicAttrs) {
    return `_d(${staticAttrs}, [${dynamicAttrs.slice(0, -1)}])`;
  } else {
    return staticAttrs;
  }
}

// // 生成事件代码
// function genHandlers(handlers, isNative) {
//   let prefix = isNative ? 'nativeOn:' : 'on:';
//   let staticHandlers = '';
//   let dynamicHandlers = '';
//   Object.keys(handlers).forEach(name=>{
//     let handler = handlers[name];
//     if (handler.dynamic) {
//       staticHandlers += `${name},${handler.value},`;
//     } else {
//       dynamicHandlers += `'${name}':${handler.value},`;
//     }
//   });
//   staticHandlers = `{${staticHandlers.slice(0, -1)}}`;
//   if (dynamicHandlers) {
//     return prefix + `_d(${staticHandlers}, [${dynamicHandlers.slice(0, -1)}])`;
//   } else {
//     return prefix + staticHandlers;
//   }
// }