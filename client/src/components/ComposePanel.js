/* eslint-env node, browser */
'use strict';

require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var s3 = new AWS.S3();
var moment = require('moment');
var template = require('./ComposePanel.html');

module.exports = {
	template: template,
	name: 'ComposePanel',
	data: function () {
		return {
			postContent: '---\ndate: ' + moment().format() + '\ntitle: new post\n---\n\n',
			key: ''
		};
	},
	ready: function () {
		if (this.$route.params.etag !== 'new') {
			var et = window.posts.find(function (o) {
				return o.ETag === this.$route.params.etag;
			}.bind(this));
			if (et) {
				// console.log(et);
				this.key = et.Key;
				var params = {
					Bucket: 'ji-blog-src',
					Key: et.Key
				};
				s3.getObject(params, function (err, data) {
					if (err) { throw new Error(err); }
					else {
						this.postContent = String.fromCharCode.apply(null, data.Body);
					}
				}.bind(this));
			}
		} else {
			console.log('new post');
		}
	},
	methods: {
		publishPost: function () {
			var params = {
				Bucket: 'ji-blog-src',
				Body: this.postContent
			};
			if (!this.key) {
				alert('Please enter a filename.');
				return;
			} else {
				params.Key = this.key;
			}
			s3.putObject(params, function (err, data) {
				if (err) { throw new Error(err); }
				console.log(data);
			});
		}
	}
};
