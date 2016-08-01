/* eslint-env node, browser */
/* global $ */
'use strict';

var LoginDialog = require('./LoginDialog');
var template = require('./App.html');

module.exports = {
	template: template,
	data: function () {
		return {
			title: 'blog admin'
		};
	},
	ready: function () {
		$('.ui .item').on('click', function () {
			$('.ui .item').removeClass('active');
			$(this).addClass('active');
		});
	},
	components: {
		'login-dialog': LoginDialog
	}
};
