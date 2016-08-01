/* eslint-env node, browser */
'use strict';

require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var bus = require('../bus');
var Post = require('./Post');
var template = require('raw!./PostList.html');

var s3 = new AWS.S3();

module.exports = {
	template: template,
	name: 'PostList',
	data: function () {
		return {
			posts: []
		};
	},
	methods: {
		getPosts: function (evt) {
			var params = {
				Bucket: 'ji-blog-src',
				Prefix: 'content/'
			};
			s3.listObjects(params, function (err, data) {
				if (err) { throw new Error(err); }
				console.log(data.Contents);
				this.posts = data.Contents.map(function (o) {
					return {
						filename: o.Key,
						date: o.LastModified
					};
				});
			}.bind(this));
		}
	},
	created: function () {
		bus.$on('logged-in', this.getPosts);
	},
	destroyed: function () {
		bus.$off('logged-in', this.getPosts);
	},
	components: {
		'post': Post
	}
};
