import htmlParser from './src/html-parser';
import optimizer from './src/optimizer';
import tpl1 from './template/1.tpl';
import modules from './src/modules';

let options = {
  modules: modules
}
// console.log(tpl1);
let ast = htmlParser(tpl1, options)
optimizer(ast, options)
console.log(ast);