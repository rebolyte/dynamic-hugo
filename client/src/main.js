/* eslint-env node, browser */
/* global $ */
'use strict';

// Webpack + AWS SDK workaround
// https://github.com/aws/aws-sdk-js/issues/603#issuecomment-188454178
require('aws-sdk/dist/aws-sdk');
var AWS = window.AWS;
var Vue = require('vue');
var VueRouter = require('vue-router');
require('../node_modules/semantic-ui-css/semantic.js');
require('./polyfills');

// --- AWS config
// Must be included before our components

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

// -- components
// Root element for the router. Note that this is not an instance of Vue.
var App = require('./components/App');
var ComposePanel = require('./components/ComposePanel');
var PostsPanel = require('./components/PostsPanel');
var SettingsPanel = require('./components/SettingsPanel');


$(document).ready(function () {

	window.posts = [];

	Vue.use(VueRouter);

	var router = new VueRouter();

	router.map({
		'/posts': {
			name: 'posts',
			component: PostsPanel
		},
		'/compose/:etag': {
			name: 'compose',
			component: ComposePanel
		},
		'/settings': {
			name: 'settings',
			component: SettingsPanel
		}
	});

	router.alias({
		'/': '/posts'
	});

	router.start(App, '#app');

});
