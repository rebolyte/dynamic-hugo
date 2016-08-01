/* eslint-env node, browser */
'use strict';

var LoginDialog = require('./LoginDialog');
var template = require('raw!./App.html');

module.exports = {
	template: template,
	data: function () {
		return {
			title: 'blog admin'
		};
	},
	components: {
		'login-dialog': LoginDialog
	}
};
