console.log('Loading function');

// dependencies
var AWS = require('aws-sdk');
var crypto = require('crypto');

// Get reference to AWS clients
var dynamodb = new AWS.DynamoDB();
var cognitoidentity = new AWS.CognitoIdentity();

var CONFIG = {
	cognitoPoolId: '',
	cognitoLoginProviderName: '',
	DyDBTableName: ''
};

function computeHash(password, salt, fn) {
	// Bytesize
	var len = 256;
	var iterations = 10000;

	if (arguments.length === 3) {
		crypto.pbkdf2(password, salt, iterations, len, function (err, derivedKey) {
			if (err) { return fn(err); }
			else { fn(null, salt, derivedKey.toString('base64')); }
		});
	} else {
		fn = salt;
		crypto.randomBytes(len, function (err, salt) {
			if (err) { return fn(err); }
			salt = salt.toString('base64');
			computeHash(password, salt, fn);
		});
	}
}

function getUser(email, fn) {
	dynamodb.getItem({
		TableName: CONFIG.DyDBTableName,
		Key: {
			email: {
				S: email
			}
		}
	}, function (err, data) {
		if (err) { return fn(err); }
		else {
			if ('Item' in data) {
				var hash = data.Item.passHash.S;
				var salt = data.Item.passSalt.S;
				fn(null, hash, salt);
			} else {
				fn(null, null); // User not found
			}
		}
	});
}

function getToken(email, fn) {
	var param = {
		IdentityPoolId: CONFIG.cognitoPoolId,
		Logins: {} // To have provider name in a variable
	};
	param.Logins[CONFIG.cognitoLoginProviderName] = email;
	cognitoidentity.getOpenIdTokenForDeveloperIdentity(param,
		function(err, data) {
			if (err) {return fn(err); } // an error occurred
			else { fn(null, data.IdentityId, data.Token); } // successful response
		});
}

exports.handler = function (event, context) {
	var email = event.email;
	var clearPassword = event.password;

	getUser(email, function (err, correctHash, salt, verified) {
		if (err) {
			context.fail('Error in getUser: ' + err);
		} else {
			if (correctHash === null) {
				// User not found
				console.log('User not found: ' + email);
				context.succeed({
					login: false
				});
			} else {
				computeHash(clearPassword, salt, function (err, salt, hash) {
					if (err) {
						context.fail('Error in hash: ' + err);
					} else {
						console.log('correctHash: ' + correctHash + ' hash: ' + hash);
						if (hash === correctHash) {
							// Login ok
							console.log('User logged in: ' + email);
							getToken(email, function (err, identityId, token) {
								if (err) {
									context.fail('Error in getToken: ' + err);
								} else {
									context.succeed({
										login: true,
										identityId: identityId,
										token: token
									});
								}
							});
						} else {
							// Login failed
							console.log('User login failed: ' + email);
							context.succeed({
								login: false
							});
						}
					}
				});
			}
		}
	});
};
