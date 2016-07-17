/* eslint-env node, browser */

'use strict';

// Webpack + AWS SDK workaround
// https://github.com/aws/aws-sdk-js/issues/603#issuecomment-188454178
require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var Vue = require('vue');
var Keen = require('keen-ui');
var $ = require('dominus');

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

function ready(fn) {
	if (document.readyState !== 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function () {

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

	Vue.use(Keen);

	Vue.component('login-dialog', {
		template: '#loginDialogTemplate',
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
			},
			header: {
				type: String,
				default: 'Login'
			},
			body: {
				type: String,
				default: 'body'
			},
			transition: {
				type: String,
				default: 'ui-modal-fade' // 'ui-modal-scale', or 'ui-modal-fade'
			}
		},
		beforeDestroy: function () {
			if (this.show) {
				this.tearDown();
			}
		},
		methods: {
			tearDown: function () {
				$('body').removeClass('ui-modal-open');
			},
			login: function () {
				sendLogin(this.email, this.password).then(function (resp) {
					if (resp.success) {
						console.log('success');
						this.show = false;
						this.tearDown();
					} else {
						alert('login failed');
					}
				}.bind(this)).catch(function (err) {
					console.error(err);
				});
			},
			emailChange: function (evt) {
				this.email = evt.target.value;
			},
			passChange: function (evt) {
				this.password = evt.target.value;
			}
		},
		events: {
			'show-login': function () {
				this.show = true;
			}
		},
		components: {
			uiTextbox: Keen.uiTextbox,
			uiButton: Keen.uiButton
		}
	});

	new Vue({
		el: '#app',
		data: {
			title: 'blog admin'
		},
		methods: {
			listObjects: function (evt) {
				var params = {
					Bucket: 'ji-blog-src',
					Prefix: 'content/'
				};
				s3.listObjects(params, function (err, data) {
					if (err) { throw new Error(err); }
					console.log(data.Contents);
				});
			}
		},
		created: function () {
			this.$broadcast('show-login', 'yep');
		}
	});
});


