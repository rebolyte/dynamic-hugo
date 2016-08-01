/* eslint-env node, browser */
'use strict';

require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var moment = require('moment');
var bus = require('../bus');
var Post = require('./Post');
var template = require('./PostList.html');

var s3 = new AWS.S3();

function mapPosts(o) {
	return {
		filename: o.Key,
		date: moment.parseZone(o.LastModified).format('D MMM, YYYY h:mm A z'),
		etag: o.ETag
	};
}

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
				Prefix: 'content/blog/'
			};
			s3.listObjects(params, function (err, data) {
				if (err) { throw new Error(err); }
				// console.log(data.Contents);
				window.posts = data.Contents;
				this.posts = data.Contents.map(mapPosts);
			}.bind(this));
		}
	},
	created: function () {
		bus.$on('logged-in', this.getPosts);
	},
	destroyed: function () {
		bus.$off('logged-in', this.getPosts);
	},
	ready: function () {
		if (window.posts.length) {
			this.posts = window.posts.map(mapPosts);
		}
	},
	components: {
		'post': Post
	}
};
