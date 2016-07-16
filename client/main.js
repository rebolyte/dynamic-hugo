/* eslint-env browser */
/* global AWS, Vue */
(function () {
	'use strict';

	var lambda = new AWS.Lambda({
		region: 'us-east-1'
	});

	var s3 = new AWS.S3();

	// Set up utilities to make working with the DOM nicer
	var $ = document.querySelector.bind(document);
	var $$ = document.querySelectorAll.bind(document);
	Node.prototype.on = Node.prototype.addEventListener;

	function login(email, pass) {
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
				console.log(err, err.stack);
			}
			else {
				output = JSON.parse(data.Payload);
				if (!output.login) {
					console.log('login failed');
				} else {
					creds = AWS.config.credentials;
					creds.params.IdentityId = output.identityId;
					creds.params.Logins = {
						'cognito-identity.amazonaws.com': output.token
					};
					creds.expired = true;

					console.log('success!');
				}
			}
		});
	}

	function ready(fn) {
		if (document.readyState !== 'loading'){
			fn();
		} else {
			document.on('DOMContentLoaded', fn);
		}
	}

	ready(function () {
		$('#loginBtn').on('click', function () {
			login($('#emailFld').value, $('#passFld').value);
		});

		$('#listBtn').on('click', function () {
			var params = {
				Bucket: 'ji-blog-src',
				Prefix: 'content/'
			};
			s3.listObjects(params, function (err, data) {
				if (err) { throw new Error(err); }
				console.log(data.Contents);
			});
		});

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
			created: function () {
				console.log('main app created!');
			}
		});
	});

}());
