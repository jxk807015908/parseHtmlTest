import {
  getAttrs,
  getBindingAttr
} from "../utils"

function transformNode(el, options) {
  let val = getAttrs(el, 'class');
  if (val) {
    el.staticClass = JSON.stringify(val);
    return;
  }
  val = getBindingAttr(el, 'class');
  if (val) {
    el.classBinding = val;
  }
}

function genData(el, options) {
  let data = '';
  if (el.staticClass) {
    data += `staticClass: ${el.staticClass}`
  }
  if (el.classBinding) {
    data += `,class: ${el.classBinding}`
  }
  return data;
}

export default {
  transformNode,
  genData,
}