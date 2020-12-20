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

export default {
  transformNode
}