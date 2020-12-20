// 生成属性映射表
export function getAttrsMap(attrs = []) {
  return attrs.reduce((map, obj) =>(map[obj.name]=obj.value,map), {});
}

// 通过属性映射表获取对应属性
export function getAttrs(el, name) {
  let val = el.attrsMap[name];
  (val || val === '') && (el.attrsList = el.attrsList.filter(obj=>obj.name !== name));
  return val
}

// 获取对应属性值的表达式
export function getBindingAttr(el, name) {
  let dynamicValue = getAttrs(el, `v-bind:${name}`) || getAttrs(el, `:${name}`);
  if (dynamicValue)
    return dynamicValue;
  else {
    let value = getAttrs(el, name);
    return value && JSON.stringify(value);
  }
}

// 获取对应属性值的表达式
export function getAttrByReg(el, reg) {
  let index = el.attrsList.findIndex(obj=>reg.test(obj.name));
  if (index !== -1) {
    return el.attrsList.splice(index, 1)[0];
  }
}

// 添加属性（动态属性名和静态属性名的分开存放）
export function addAttr(el, name, value, dynamic = false) {
  (dynamic ? (el.dynamicAttrs || (el.dynamicAttrs = [])) : (el.attrs || (el.attrs = []))).push({
    name,
    value,
    dynamic
  })
}

// 添加事件（原生事件和动态事件）
export function addHandlers(el, name, value, modifiers = {}, dynamic = false) {
  if (modifiers.capture) {
    name = dynamic ? (`_p(${name}, '!')`) : ('!' + name);
  }
  if (modifiers.once) {
    name = dynamic ? (`_p(${name}, '~')`) : ('~' + name);
  }
  if (modifiers.passive) {
    name = dynamic ? (`_p(${name}, '&')`) : ('&' + name);
  }
  let events = (modifiers.native ? (el.nativeEvents || (el.nativeEvents = {})) : (el.events || (el.events = {})));
  let handlers = (events[name] || (events[name] = []));
  handlers.push({
    value,
    dynamic
  });
}

// 添加事件（原生事件和动态事件）
export function addDriectives(el, name, rawName, value, arg, isDynamicArg = false, modifiers = {}) {
  (el.directives || (el.directives = [])).push({
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers
  });
}

// 处理绑定值 // TODO 没有考虑直接使用实例的情况 如 ['aa'], {a:'1'}, aaa[bb['cc']]或随便乱打如sds;sfsdgf;d'
export function parseModel(value) {
  let match = value.match(/\.([^\]]+)$/);
  if (match) {
    let key = match[1];
    return {
      exp: value.slice(0, -key.length - 1),
      key: JSON.stringify(key)
    }
  }
  match = value.match(/^[^\[](\[[^\[\]]+\])$/);
  if (match) {
    let key = match[1];
    return {
      exp: value.slice(0, -key.length),
      key: key.slice(1, key.length - 1)
    }
  }
  return {
    exp: value,
    key: ''
  }
}

