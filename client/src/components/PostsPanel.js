/* eslint-env node, browser */
'use strict';

var bus = require('../bus');
var PostList = require('./PostList');
var template = require('./PostsPanel.html');

module.exports = {
	template: template,
	name: 'PostsPanel',
	methods: {
		getPosts: function () {
			bus.$emit('logged-in');
		}
	},
	components: {
		'post-list': PostList
	}
};
