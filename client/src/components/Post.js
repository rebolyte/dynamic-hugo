/* eslint-env node, browser */
'use strict';

var template = require('raw!./Post.html');

module.exports = {
	template: template,
	name: 'Post',
	props: ['post'],
	methods: {
		selected: function (evt) {
			console.log(evt.target);
		}
	}
};
