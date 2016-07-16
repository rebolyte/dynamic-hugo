/* eslint-env node, es6 */

'use strict';

let AWS = require('aws-sdk');

let s3 = new AWS.S3();

let params = {
	Bucket: 'ji-blog-src',
	Prefix: 'content/'
};
s3.listObjects(params, (err, data) => {
	if (err) { throw new Error(err); }
	console.log(data.Contents);
});
