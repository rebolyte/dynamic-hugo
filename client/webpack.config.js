/* eslint-env node */
'use strict';

let webpack = require('webpack');
let path = require('path');

let SRC_DIR = path.resolve(__dirname, 'src');
let DIST_DIR = path.resolve(__dirname, 'dist');

module.exports = {
	entry: SRC_DIR + '/main.js',
	output: {
		path: DIST_DIR,
		filename: 'bundle.js'
	},
	// https://webpack.github.io/docs/list-of-plugins.html#provideplugin
	plugins: [
		new webpack.ProvidePlugin({
			'$': 'jquery',
			'jQuery': 'jquery',
			'window.jQuery': 'jquery'
		})
	]
};
