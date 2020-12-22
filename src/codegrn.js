class CodegenState {
  constructor() {
    this.staticRenderFns = [];
  }
}

export default function (ast, options) {
  let state = new CodegenState();
  let code = genElement(ast, state);
  return {
    render: `with(this) {return ${code}}`,
    staticRenderFns: state.staticRenderFns
  }
}

function genElement(node, state) {
  if (node.type === 1) {
    return `_c('${node.tag}', )`
  }
}

function genData(node) {
  let objStr = '{';
  if (node.ref) {
    objStr += `ref:'${node.ref}'`;
  }
  if (node.key) {
    objStr += `key:'${node.key}'`;
  }
  objStr += '}';
  return objStr;
}