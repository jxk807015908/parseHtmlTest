import {makeMap} from "./utils";

export default function (node, options) {
  judgeStatic(node)
  judgeStaticRoot(node, false)
}
// 静态属性映射表
const staticKeyMap = makeMap('type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap,staticClass,staticStyle');
// 静态节点名映射表
const originTagMap = makeMap('html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'+

    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view');

function isStaticKey(node) {
  return Object.keys(node).every(key=>staticKeyMap[key]);
}
function hasTemplateWithFor(node) {
  node = node.parent;
  while (node) {
    if (node.tag !== 'template') {
      return false;
    }
    if (node.for) {
      return true;
    }
  }
  return false;
}

function isStatic(node) {
  if (node.type === 3) {
    return true;
  }
  if (node.type === 2) {
    return false;
  }
  // 1.有v-pre属性的，直接判定为静态
  // 2.hasBindings为true说明有绑定内容，判定为动态
  // 3.有v-if、v-for判定为动态
  // 4.节点名为slot、component说明是动态的
  // 5.如果标签名不是原生的，说明是动态的
  // 6.父级是template并且有v-for说明是动态的
  // 7.节点上的属性都是静态的属性时，说明是静态的
  return node.pre || (
      !node.hasBindings &&
      !node.if &&
      !node.for &&
      !['slot', 'component'].includes(node.tag) &&
      originTagMap[node.tag] &&
      !hasTemplateWithFor(node) &&
      isStaticKey(node)
  )
}

function judgeStatic(node) {
  node.static = isStatic(node);
  if (node.type === 1) {
    if (['slot', 'component'].includes(node.tag) || node.inlineTemplate || !originTagMap[node.tag]) {
      return;
    }
    node.children && node.children.forEach(child=>{
      judgeStatic(child);
      // 子节点中有非静态节点时，父节点必不可能是静态节点
      if (!child.static) {
        node.static = false;
      }
    })
    node.ifConditions && node.ifConditions.forEach(({block}, index)=>{
      if (index !== 0) {
        judgeStatic(block);
        if (!block.static) {
          node.static = false;
        }
      }
    })
  }
}

function judgeStaticRoot(node, isFor) {
  if (node.static || node.once) {
    node.staticInFor = isFor;
  }
  if (node.static && node.children && node.children.length && !(node.children.length === 1 && node.children[0].type === 3)) {
    node.staticRoot = true;
  } else {
    node.staticRoot = false;
  }
  node.children && node.children.forEach(child=>{
    judgeStaticRoot(child, !!child.for);
  })
  node.ifConditions && node.ifConditions.forEach(({block}, index)=>{
    if (index !== 0) {
      judgeStaticRoot(block, !!block.for);
    }
  })
}