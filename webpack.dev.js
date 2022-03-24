const { merge } = require('webpack-merge');
const config = require('./webpack.config.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(config, {
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin({
            template: './dev/index.html'
        })
    ]
});