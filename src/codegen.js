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

// 转化元素节点
function genElement(el, state) {
  let attrs = genData(el, state);
  let children = genChildren(el, state);
  return `_c('${el.tag}', ${attrs}${children ? `,${children}` : ''})`
}

// 转化节点
function genNode(el, state) {
  if (el.type === 3 && el.isComment) {
    return genComment(el);
  } else if (el.type === 1) {
    return genElement(el, state);
  } else {
    return genText(el);
  }
}

// 转化注释节点
function genComment(el) {
  return `_e(${JSON.stringify(el.text)})`;
}

// 转化文本节点
function genText(el) {
  return `_v(${el.type === 2 ? el.expression : JSON.stringify(el.text)})`;
}

// 转化子节点
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

// 转化属性
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
  if (el.nativeEvents) {
    objStr += `nativeOn:${genHandlers(el.nativeEvents, true)}`;
  }
  if (el.events) {
    objStr += `nativeOn:${genHandlers(el.events, false)}`;
  }
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

// 生成事件代码
function genHandlers(handlers, isNative) {
  let prefix = isNative ? 'nativeOn:' : 'on:';
  let staticHandlers = '';
  let dynamicHandlers = '';
  Object.keys(handlers).forEach(name=>{
    let handlerCode = genHandler(handlers[name]);
    if (handlers[name] && handlers[name].dynamic) {
      staticHandlers += `${name},${handlerCode},`;
    } else {
      dynamicHandlers += `'${name}':${handlerCode},`;
    }
  });
  staticHandlers = `{${staticHandlers.slice(0, -1)}}`;
  if (dynamicHandlers) {
    return prefix + `_d(${staticHandlers}, [${dynamicHandlers.slice(0, -1)}])`;
  } else {
    return prefix + staticHandlers;
  }
}

// 生成事件代码
const IS_FUNCTION_REG = /^\s*([\w$_]+|\([\w$_]+\))\s*=>|^\s*function\s*\([\w$_]*\)\s*\{.*\}$/;
const IS_METHOD_REG = /^[a-zA-Z0-9_$]+$/;
const MODIFIERS_CODE_MAP = {
  prevent: `$event.preventDefault();`,
  stop: `$event.stopPropagation();`,
  self: genGuard(`$event.target !== $event.currentTarget`),
  ctrl: genGuard(`!$event.ctrlKey`),
  shift: genGuard(`!$event.shiftKey`),
  alt: genGuard(`!$event.altKey`),
  meta: genGuard(`!$event.metaKey`),
  left: genGuard(`'button' in $event && $event.button !== 0`),
  middle: genGuard(`'button' in $event && $event.button !== 1`),
  right: genGuard(`'button' in $event && $event.button !== 2`)
};
function genGuard(str) {
  return `if (${str}) return null;`
}
// KeyboardEvent.keyCode aliases
const keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
}

// KeyboardEvent.key aliases
const keyNames = {
  // #7880: IE11 and Edge use `Esc` for Escape key name.
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  // #9112: IE11 uses `Spacebar` for Space key name.
  space: [' ', 'Spacebar'],
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  // #9112: IE11 uses `Del` for Delete key name.
  'delete': ['Backspace', 'Delete', 'Del']
}
function genKeyCode(key) {
  let keyCode = keyCodes[key];
  let keyName = keyNames[key];
  return `_k($event.keyCode,${JSON.stringify(key)},${JSON.stringify(keyCode)},$event.key,${JSON.stringify(keyName)})`
}
// 将event的配置项转化为事件执行代码
function genHandler(handler) {
  if (Array.isArray(handler)) {
    return `[${handler.map(genHandler).join(',')}]`
  }
  const isFunction = IS_FUNCTION_REG.test(handler.value);
  const isMethod = IS_METHOD_REG.test(handler.value);
  // 没有修饰符的直接返回
  if (!handler.modifiers) {
    if (isFunction || isMethod) {
      return handler.value;
    } else {
      return `function ($event) {return ${handler.value}}`;
    }
  } else {
    let code = '';
    let modifiersCode = '';
    let keys = [];
    Object.keys(handler.modifiers).map(name=>{
      if (MODIFIERS_CODE_MAP[name]) {
        // 处理一些特殊修饰符
        modifiersCode += MODIFIERS_CODE_MAP[name];
      } else if (name === 'exact') {
        modifiersCode += genGuard(['ctrl', 'shift', "alt", 'meta'].filter(str=>handler.modifiers[str]).map(str=>`$event.${str}Key`).join('||'));
      } else {
        keys.push(name);
      }
    });
    // 处理需要使用keyCode的修饰符
    if (keys.length) {
      code += genGuard(keys.map(genKeyCode).join('&&'));
    }
    if (modifiersCode) {
      code += modifiersCode;
    }
    let handlerCode = `return ${isFunction || isMethod ? `${handler.value}.apply(null, arguments)` : handler.value};`;
    return `function ($event) {${code}${handlerCode}}`
  }
}
