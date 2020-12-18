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