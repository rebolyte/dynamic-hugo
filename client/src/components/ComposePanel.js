/* eslint-env node, browser */
'use strict';

var S3 = require('aws-sdk/clients/s3');
var s3 = new S3();
var moment = require('moment');
var template = require('./ComposePanel.html');

var CONFIG = require('../config');

module.exports = {
	template: template,
	name: 'ComposePanel',
	data: function () {
		return {
			postContent: '---\ndate: ' + moment().format() + '\ntitle: new post\n---\n\n',
			key: '',
			publishSuccess: false
		};
	},
	ready: function () {
		if (this.$route.params.etag !== 'new') {
			var et = window.posts.find(function (o) {
				return o.ETag === this.$route.params.etag;
			}.bind(this));
			if (et) {
				// console.log(et);
				var parts = et.Key.split('/');
				this.key = parts[parts.length - 1];
				var params = {
					Bucket: CONFIG.s3SrcBucket,
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
				Bucket: CONFIG.s3SrcBucket,
				Body: this.postContent
			};
			if (!this.key) {
				alert('Please enter a filename.');
				return;
			} else if (!/.md$/.test(this.key)) {
				alert('Filename must end in .md.');
				return;
			} else {
				params.Key = CONFIG.s3SrcBucketPrefix + this.key;
			}
			s3.putObject(params, function (err, data) {
				if (err) { throw new Error(err); }
				console.log(data);
				this.publishSuccess = true;
				setTimeout(function () {
					this.$route.router.go({ name: 'posts' });
				}.bind(this), 1000);
			}.bind(this));
		}
	}
};
