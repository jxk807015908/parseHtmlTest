import {
  getAttrs,
  getBindingAttr,
  getAttrByReg
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