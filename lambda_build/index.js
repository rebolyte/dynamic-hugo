/* eslint-env node, es6 */
'use strict';

let AWS = require('aws-sdk');
let s3Package = require('s3');
let childProcess = require('child_process');

let config = require('./config');

// https://github.com/ryansb/hugo-lambda/blob/master/generate/lib/RunHugo.js

let s3 = new AWS.S3();

let s3Client = s3Package.createClient({
	maxAsyncS3: 20,
	s3Client: s3
});

let tmpDir = '/tmp/src';
let outDir = tmpDir + '/public';

function downloadSrcDir() {
	return new Promise((resolve, reject) => {
		let dl = s3Client.downloadDir({
			localDir: tmpDir,
			s3Params: {
				Bucket: config.srcBucket
			}
		});
		dl.on('error', reject);
		dl.on('end', resolve);
	});
}

function runHugo() {
	return new Promise((resolve, reject) => {
		let child = childProcess.spawn('./hugo', ['-v', '--source=' + tmpDir, '--destination=' + outDir], {});
		child.stdout.on('data', data => {
			console.log('hugo-stdout: ' + data);
		});
		child.stderr.on('data', data => {
			console.log('hugo-stderr: ' + data);
		});
		child.on('error', err => {
			console.log('hugo failed with error: ' + err);
			reject(err);
		});
		child.on('close', code => {
			console.log('hugo exited with code: ' + code);
			resolve();
		});
	});
}

function uploadBuiltDir() {
	return new Promise((resolve, reject) => {
		let ul = s3Client.uploadDir({
			localDir: outDir,
			deleteRemoved: false,
			s3Params: {
				Bucket: config.destBucket
			}
		});
		ul.on('error', reject);
		ul.on('end', resolve);
	});
}

exports.handler = function (event, context, cb) {
	downloadSrcDir()
	.then(runHugo)
	.then(uploadBuiltDir)
	.then(() => {
		cb(null, 'exiting normally');
	})
	.catch(err => {
		console.error(err);
		cb(err);
	});

};
