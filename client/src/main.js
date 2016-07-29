/* eslint-env node, browser */
/* global $ */

'use strict';

// Webpack + AWS SDK workaround
// https://github.com/aws/aws-sdk-js/issues/603#issuecomment-188454178
require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var Vue = require('vue');
var semantic = require('../node_modules/semantic-ui-css/semantic.js');

// --- AWS config

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html
// http://stackoverflow.com/a/27561468/2486583
// Also see sample code within Cognito in AWS Console.
// https://forums.aws.amazon.com/thread.jspa?threadID=179420
// https://mobile.awsblog.com/post/TxBVEDL5Z8JKAC/Use-Amazon-Cognito-in-your-website-for-simple-AWS-authentication
AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
	IdentityPoolId: 'us-east-1:2d7ca187-7471-45cd-bc71-5d78b6bcd7d1'
});

AWS.config.credentials.clearCachedId();

AWS.config.credentials.get(function (err) {
	if (err) { console.error(err); }
	else { console.log('cognito credentials loaded'); }
});

// --- Set up variables

var lambda = new AWS.Lambda({
	region: 'us-east-1'
});

var s3 = new AWS.S3();

// Set up utilities to make working with the DOM nicer
// var $ = document.querySelector.bind(document);
// var $$ = document.querySelectorAll.bind(document);
// Node.prototype.on = Node.prototype.addEventListener;

function sendLogin(email, pass) {
	return new Promise(function (resolve, reject) {
		var input = {
			email: email,
			password: pass
		};
		var output;
		var creds;
		lambda.invoke({
			FunctionName: 'JIBlogLogin',
			Payload: JSON.stringify(input)
		}, function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				output = JSON.parse(data.Payload);
				if (!output.login) {
					resolve({ success: false });
				} else {
					creds = AWS.config.credentials;
					creds.params.IdentityId = output.identityId;
					creds.params.Logins = {
						'cognito-identity.amazonaws.com': output.token
					};
					creds.expired = true;

					resolve({ success: true });
				}
			}
		});
	});
}

var bus = new Vue();

var LoginDialog = Vue.extend({
	template: '#loginDialogTemplate',
	name: 'LoginDialog', // not required, but useful for debugging
	data: function () {
		return {
			email: '',
			password: ''
		};
	},
	props: {
		show: {
			type: Boolean,
			// required: true,
			twoWay: true
		}
	},
	// called after compilation is finished
	ready: function () {
		if (this.show) {
			this.open();
		}
	},
	methods: {
		login: function () {
			return sendLogin(this.email, this.password);
		},
		// http://stackoverflow.com/a/29713297/2486583
		open: function () {
			$(this.$els.modal)
				.modal({
					'closable': false,
					onApprove: function () {
						$(this.$els.form).submit();
						// Prevent modal from closing
						return false;
					}.bind(this)
				})
				.modal('show');
			$(this.$els.form)
				.submit(function (evt) {
					evt.preventDefault();
					if ($(this.$els.form).form('validate form')) {
						this.login().then(function (resp) {
							if (resp.success) {
								console.log('success');
								this.close();
							} else {
								alert('login failed');
							}
						}.bind(this)).catch(function (err) {
							console.error(err);
						});
					}
				}.bind(this))
				.form({
					fields: {
						email: 'email',
						password: 'empty'
					}
				});
		},
		close: function () {
			$(this.$els.modal).modal('hide');
		}
	}
});

var Post = Vue.extend({
	template: '#postTemplate',
	name: 'Post',
	props: ['post'],
	methods: {
		selected: function (evt) {
			console.log(evt.target);
		}
	}
});

var PostList = Vue.extend({
	template: '#postListTemplate',
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
});

$(document).ready(function () {

	$('#postBtn').on('click', function () {
		var params = {
			Bucket: 'ji-blog-src',
			Key: 'content/new-page.md',
			Body: $('#postFld').value
		};
		s3.putObject(params, function (err, data) {
			if (err) { throw new Error(err); }
			console.log(data);
		});
	});

	new Vue({
		el: '#app',
		data: {
			title: 'blog admin'
		},
		methods: {
			getPosts: function () {
				bus.$emit('logged-in');
			}
		},
		components: {
			'login-dialog': LoginDialog,
			'post-list': PostList
		}
	});

});
