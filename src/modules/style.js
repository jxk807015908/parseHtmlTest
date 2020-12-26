import {
  getAttrs,
  getBindingAttr
} from "../utils"

function transformNode(el, options) {
  let val = getAttrs(el, 'style');
  if (val) {
    el.staticStyle = JSON.stringify(val);
    return;
  }
  val = getBindingAttr(el, 'style');
  if (val) {
    el.styleBinding = val;
  }
}

function genData(el, options) {
  let data = '';
  if (el.staticStyle) {
    data += `,staticStyle: ${el.staticStyle}`
  }
  if (el.styleBinding) {
    data += `,style: ${el.styleBinding}`
  }
  return data;
}

export default {
  transformNode,
  genData,
}