const path = require('path');
const os = require('os');
const HtmlWebpackPlugin = require("html-webpack-plugin");

//获取本地ip地址
function getNetworkIp() {
  let needHost = ""; // 打开的host
  try {
    // 获得网络接口列表
    let network = os.networkInterfaces();
    for (let dev in network) {
      let iface = network[dev];
      for (let i = 0; i < iface.length; i++) {
        let alias = iface[i];
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        ) {
          needHost = alias.address;
        }
      }
    }
  } catch (e) {
    needHost = "localhost";
  }
  return needHost;
}

module.exports = {
  entry: path.resolve(__dirname, './index.js'),
  output: {//多出口, 这里的[name] 对应 page1 和 page2 取代
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.tpl$/,
        loader: 'raw-loader'
      }
      // {
      //   test: /\.html$/,
      //   loader: 'html-loader',
      //   options: {
      //     minimize: {
      //       collapseWhitespace: true,
      //       collapseInlineTagWhitespace: true,//折叠时，请勿在元素之间留任何空
      //       conservativeCollapse: false, //始终折叠到1个空间（永远不要将其完全删除）
      //       keepClosingSlash: true,
      //       minifyCSS: true,
      //       minifyJS: true,
      //       removeAttributeQuotes: true,
      //       removeComments: true,
      //       removeScriptTypeAttributes: true,
      //       removeStyleLinkTypeAttributes: true,
      //       useShortDoctype: true
      //     },
      //   },
      // }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
      filename: `index.html`,
      // minify: {
      //   html5: true,
      //   collapseWhitespace: true,
      //   preserveLineBreaks: false,
      //   minifyCSS: true,
      //   minifyJS: true,
      //   removeComments: true,
      // },
    })
  ],
  devServer: {
    contentBase: "./public",//服务器访问的基本路径
    host: getNetworkIp(),//服务器ip
    // port: 3333,//端口
  }
}