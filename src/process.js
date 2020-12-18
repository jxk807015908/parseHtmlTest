import {
  getAttrs
} from "./utils";

// 处理v-pre属性
export function processVPre(el) {
  let val = getAttrs(el, 'v-pre');
  if (val || val === '') {
    return el.pre = true;
  }
}

// for表达式分区块正则
const FOR_VALUE_REG = /([\S\s]+?)\s+(?:in|of)\s+([\S\s]+)/;
// 别名匹配
const ALIAS_REG = /^([^,\{\}\(\)\[\]]+)(?:\s*,\s*([^,\{\}\(\)\[\]]+))?(?:\s*,\s*([^,\{\}\(\)\[\]]+))?$/;
// 处理v-for属性
export function processFor(el) {
  let val = getAttrs(el, 'v-for');
  if (val) {
    let match = val.match(FOR_VALUE_REG);
    el.for = match[2].trim();
    let aliasMatch = match[1].trim().replace(/^\(/, '').replace(/\)$/, '').match(ALIAS_REG);
    if (aliasMatch) {
      el.alias = aliasMatch[1];
      el.iterator1 = aliasMatch[2];
      el.iterator2 = aliasMatch[3];
    } else {
      console.warn(el, 'v-for', val);
    }
  }
}