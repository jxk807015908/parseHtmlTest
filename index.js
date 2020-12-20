import htmlParser from './src/html-parser';
import tpl1 from './template/1.tpl';
import modules from './src/modules';

let options = {
  modules: modules
}
// console.log(tpl1);
console.log(htmlParser(tpl1, options));