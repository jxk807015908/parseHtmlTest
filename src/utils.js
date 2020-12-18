// 生成属性映射表
export function getAttrsMap(attrs = []) {
  return attrs.reduce((map, obj) =>(map[obj.name]=obj.value,map), {});
}

// 通过属性映射表获取对应属性
export function getAttrs(el, name) {
  return el.attrsMap[name];
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
  return el.attrsList.find(obj=>reg.test(obj.name));
}