/* eslint-env node */
'use strict';

// let webpack = require('webpack');
let path = require('path');

let SRC_DIR = path.resolve(__dirname, 'src');
let DIST_DIR = path.resolve(__dirname, 'dist');

module.exports = {
	entry: SRC_DIR + '/main.js',
	output: {
		path: DIST_DIR,
		filename: 'bundle.js'
	}
};
