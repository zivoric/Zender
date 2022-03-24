const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'zender.js',
        library: {
            name: 'Zender',
            type: 'umd'
        }
    },
    resolve: {
        extensions: ['.ts','.js'],
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            use: "babel-loader"
        },
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: "source-map-loader"
        },
        {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
        }
    ]},
};