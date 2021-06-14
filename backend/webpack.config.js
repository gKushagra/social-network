const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'production',
    devtool: 'source-map',
    entry: {
        http: './http-server/server.js',
        socket: './socket-server/server.js'
    },
    output: {
        path: path.join(__dirname, '/dist/'),
        filename: '[name]Server.js'
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                exclude: /node_modules/
            }
        ]
    }
}