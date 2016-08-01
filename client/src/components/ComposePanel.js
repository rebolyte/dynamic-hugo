/* eslint-env node, browser */
'use strict';

require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var s3 = new AWS.S3();
var template = require('raw!./ComposePanel.html');

module.exports = {
	template: template,
	name: 'ComposePanel',
	data: function () {
		return {
			postContent: ''
		};
	},
	methods: {
		publishPost: function () {
			var params = {
				Bucket: 'ji-blog-src',
				Key: 'content/new-page.md',
				Body: this.postContent
			};
			s3.putObject(params, function (err, data) {
				if (err) { throw new Error(err); }
				console.log(data);
			});
		}
	}
};
