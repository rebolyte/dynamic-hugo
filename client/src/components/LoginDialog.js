/* eslint-env node, browser */
/* global $ */
'use strict';

require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var bus = require('../bus');
var template = require('./LoginDialog.html');

var lambda = new AWS.Lambda({
	region: 'us-east-1'
});

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

module.exports = {
	template: template,
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
								this.close();
								bus.$emit('logged-in');
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
};
