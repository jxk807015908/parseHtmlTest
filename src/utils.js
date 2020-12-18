// 生成属性映射表
export function getAttrsMap(attrs = []) {
  return attrs.reduce((map, obj) =>(map[obj.name]=obj.value,map), {});
}

// 通过属性映射表获取对应属性
export function getAttrs(el, name) {
  return el.attrsMap[name];
}