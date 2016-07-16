/* eslint-env node, es6 */

'use strict';

let AWS = require('aws-sdk');
let crypto = require('crypto');
let readline = require('readline');

let rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

let dynamodb = new AWS.DynamoDB({
	apiVersion: '2012-08-10', // use newer, non-deprecated API
	region: 'us-east-1'
});
let docClient = new AWS.DynamoDB.DocumentClient({
	service: dynamodb
});

// Not really the correct use for a promise, but I still like it for avoiding
// callbacks.
function computeHash(password) {
	return new Promise((resolve, reject) => {
		var len = 256;
		var iterations = 10000;

		crypto.randomBytes(len, (err, salt) => {
			if (err) { reject(err); }
			salt = salt.toString('base64');
			crypto.pbkdf2(password, salt, iterations, len, 'sha1', (err, derivedKey) => {
				if (err) { reject(err); }
				resolve([derivedKey.toString('base64'), salt]);
			});
		});
	});
}

function storeUser(email, passHash, passSalt) {
	return new Promise((resolve, reject) => {
		docClient.put({
			TableName: 'JIBlogAdminUsers',
			Item: {
				email: email,
				passHash: passHash,
				passSalt: passSalt,
				dateCreated: new Date().toISOString()
			},
			ConditionExpression: 'attribute_not_exists(email)'
		}, (err, data) => {
			if (err) {
				if (err.code === 'ConditionalCheckFailedException') {
					reject('user already exists');
				} else {
					reject(err);
				}
			}
			else {
				resolve(data);
			}
		});
	});
}

function getEmail() {
	return new Promise(resolve => {
		// https://nodejs.org/api/readline.html
		rl.question('Enter new user\'s email: ', email => {
			resolve(email);
		});
	});
}

function getPassword() {
	return new Promise((resolve, reject) => {
		// https://nodejs.org/api/readline.html
		rl.question('Enter new user\'s password: ', pass1 => {
			rl.question('Repeat password: ', pass2 => {
				if (pass1 === pass2) {
					resolve(pass2);
				} else {
					reject('passwords do not match');
				}
				rl.close();
			});
		});
	});
}

let email = null;

getEmail()
.then(eml => {
	email = eml;
	return getPassword();
})
.then(computeHash)
.then(arr => {
	return storeUser(email, arr[0], arr[1]);
})
.then(() => {
	console.log('done');
})
.catch(err => {
	console.error(err);
});
