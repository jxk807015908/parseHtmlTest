import htmlParser from './src/html-parser';
import tpl1 from './template/1.tpl';

let options = {
  modules: [
    {
      transformNode: function (el, options) {
        console.log('transformNode')
      },
      preTransformNode: function (el, options) {
        console.log('preTransformNode')
      },
      postTransformNode: function (el, options) {
        console.log('postTransformNode')
      }
    }
  ]
}
// console.log(tpl1);
console.log(htmlParser(tpl1, options));