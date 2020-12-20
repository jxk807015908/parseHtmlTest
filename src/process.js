import {
  getAttrs,
  getBindingAttr,
  getAttrByReg,
  addAttr,
  addHandlers,
  addDriectives,
  parseModel,
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

// 处理v-if属性
export function processIf(el) {
  let val = getAttrs(el, 'v-if');
  if (val) {
    el.if = val;
    el.ifConditions = [{
      exp: val,
      block: el
    }];
  } else {
    val = getAttrs(el, 'v-else-if');
    if (val) {
      el.elseif = val;
    } else {
      val = getAttrs(el, 'v-else');
      if (val || val === '') {
        el.else = true;
      }
    }
  }
}

// 有v-else-if和v-else属性的节点的后续处理
export function processIfConditions(el) {
  if (el.elseif || el.else) {
    let prevElement = el.parent.children[el.parent.children.length - 1];
    if (prevElement.if) {
      prevElement.ifConditions.push({
        exp: el.elseif || el.else,
        block: el
      })
    }
  }
}

// 处理v-once
export function processOnce(el) {
  let val = getAttrs(el, 'v-once');
  if (val || val === '') {
    el.once = true;
  }
}

// 处理key
export function processKey(el) {
  let val = getBindingAttr(el, 'key');
  if (val) {
    el.key = val;
  }
}

// 处理ref
export function processRef(el) {
  let val = getBindingAttr(el, 'ref');
  if (val) {
    el.ref = val;
    el.refInFor = (()=>{
      let parent = el;
      while (parent) {
        if (parent.for) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    })();
  }
}

// 处理v-slot、slot、scope和slot-scope属性
export function processSlotContent(el) {
  let val = getBindingAttr(el, 'scope') || getBindingAttr(el, 'slot-scope');
  if (val) {
    el.slotScope = val;
  }
  let slotTarget = getBindingAttr(el, 'slot');
  if (slotTarget) {
    el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
    el.slotTargetDynamic = !!el.attrsMap[':slot'] || !!el.attrsMap['v-bind:slot'];
  }

  let slotAttrs = getAttrByReg(el, /^v-slot|#/);
  if (slotAttrs) {
    // todo v-slot没有加在template上的情况暂时不做处理
    let slotMatch = slotAttrs.name.match(/^(?:v-slot|#)(?::(?:(\[)([^\[\]]+)\]|([^\[\]]+)))?/);
    let slotTarget = slotMatch[2] || slotMatch[3];
    el.slotTargetDynamic = !!slotMatch[1];
    if (el.slotTargetDynamic) {
      el.slotTarget = slotTarget
    } else {
      el.slotTarget = JSON.stringify(slotTarget) || '"default"';
    }
    el.slotScope = slotAttrs.value;
  }
}

// 处理标签名为slot的节点
export function processSlotOutlet(el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name');
  }
}

// 处理is、inline-template属性
export function processComponent(el) {
  let val = getBindingAttr(el, 'is');
  if (val) {
    el.component = val;
  }
  if (getBindingAttr(el, 'inline-template') !== undefined ) {
    el.inlineTemplate = true;
  }
}

// 匹配修饰符正则
const MODIFIERS_REG = /\.[^.\]]+(?=[^\]]*)/g;
// 获取修饰符
function getModifiers(name) {
  let match = name.match(MODIFIERS_REG) || [];
  return match.reduce((map, str)=>(map[str.slice(1)] = true,map), {});
}
// 处理属性
export function processAttrs(el) {
  let attrsList = el.attrsList;
  attrsList.forEach(attrs=>{
    let {name, value} = attrs;
    let rawName = name;
    if (/^v-|:|@|\.|#/.test(name)) {
      el.hasBindings = true;
      let modifiers = getModifiers(name);
      if (/^\./.test(name)) {
        (modifiers || (modifiers = {})).prop = true;
        name = name.slice(1);
      }
      if (modifiers) {
        name = name.replace(MODIFIERS_REG, '');
      }
      if (/^v-bind:|:|\./.test(name)) {
        name = name.replace(/^v-bind:|:|\./, '');
        let isDynamic = /^\[.+\]$/.test(name);
        if (isDynamic) {
          name = name.slice(1, name.length - 1);
        }
        if (modifiers && modifiers.sync) {
          let res = parseModel(value);
          addHandlers(el, isDynamic ? `"update:"+(${name})` : `update:${name}` , res.key ? `$set(${res.exp}, ${res.key}, $event)` : `${res.exp}=$event`);
        }
        if (modifiers.prop) {
          (el.props || (el.props = [])).push({
            value,
            name,
            dynamic: isDynamic
          });
        } else {
          addAttr(el, name, value, isDynamic);
        }
      } else if (/^v-on:|@/.test(name)) {
        name = name.replace(/^v-on:|@/, '');
        let isDynamic = /^\[.+\]$/.test(name);
        if (isDynamic) {
          name = name.slice(1, name.length - 1);
        }
        addHandlers(el, name, value, modifiers, isDynamic);
      } else if (/^v-/.test(name)) {
        let arg = name.match(/:(.+)/)[1];
        let isDynamicArg = arg.test(/^\[.+\]$/);
        if (isDynamicArg) {
          arg = arg.slice(1, arg.length - 1);
        }
        addDriectives(el, name.match(/^v-(.+):/)[1], rawName, value, arg, isDynamicArg, modifiers);
      }
    } else {
      addAttr(el, name, JSON.stringify(value));
    }
  });
}