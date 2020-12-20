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

export default {
  transformNode
}