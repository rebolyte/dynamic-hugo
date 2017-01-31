# Dynamic Hugo

Browser interface to build your static site on demand by running Hugo on AWS Lambda.

## Setting up S3 and Lambda

1. Create a bucket for your website and one for your source files, e.g. `mycoolsite.com` and `mycoolsite-src`. Enable static site hosting on the bucket for your site, update the bucket policy to allow public GETs, and add an appropriate CORS config to it. For the source bucket, you'll also need to update the CORS config so the client can XHR at it. I use this config:

```
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>http://localhost:8000</AllowedOrigin>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <ExposeHeader>ETag</ExposeHeader>
        <ExposeHeader>x-amz-meta-custom-header</ExposeHeader>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

2. Edit lambda_build/config.js to point to the buckets you just created.
3. Edit the lambda_build/.env file with your access key ID and secret key, and change AWS_FUNCTION_NAME to something appropriate and unique.
4. Upload your Hugo site source to your source bucket.
5. `$ npm i -g node-lambda` - [node-lambda](https://github.com/motdotla/node-lambda)
6. `$ node-lambda deploy`
7. Go to the Lambda console and invoke the function you just uploaded. If it has problems, make sure the function has an IAM role that allows it to access S3 and CloudWatch, as well as sufficient time to execute before timing out (say, 10 seconds).
7. The rendered site should be output in your destination bucket.
8. Go to the Triggers tab the new Lambda function, and enable a trigger for "ObjectCreated" on your source bucket.

## Client

1. Make a Cognito federated identity pool.
- Enable access to unauthenticated identities
- Enter a developer login provider name under Authentication Providers -> Custom.
- Create the auth and unauth IAM roles that it prompts with.
- Go to IAM and edit the auth policy to match something like this:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "arn:aws:lambda:us-east-1:000000000000:function:SiteLogin"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "*"
        }
    ]
}
```

And the unauth role to look like this:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "arn:aws:lambda:us-east-1:000000000000:function:SiteLogin"
            ]
        }
    ]
}
```

2. Go to your new identity pool and copy the pool ID and the login provider name and add them to the `CONFIG` block in lambda_admin-login/index.js.
3. Create a DynamoDB table in the same region as your Cognito setup, with the partition key "email" and no sort key. Adjust the read and write capacity to something very small. Add the name of your table to the config block.
4. Create a new IAM role that will be used for your Lambda function, selecting "allow Lambda to invoke resources on your behalf." Then attach an inline policy to the role that looks like this, substituting in your Cognito and Dynamo values:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Action": [
                "dynamodb:GetItem"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:dynamodb:us-east-1:000000000000:table/JIBlogAdminUsers"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cognito-identity:GetOpenIdTokenForDeveloperIdentity"
            ],
            "Resource": "arn:aws:cognito-identity:us-east-1:000000000000:identitypool/us-east-1:2d7ca197-7471-cad7-ab3d-a12cb5abb4da"
        }
    ]
}
```

4. Create a new Lambda function in that same region. Edit the code inline (on the webpage), pasting in lambda_admin-login/index.js.
5. Edit the value in config.js to point to your Dynamo DB admin users table.
6. Run create-user.js on your machine. This will create a record in your Dynamo table.
7. Do a test invocation of your login Lambda using the email and password you  entered in create-user.js, like this:

```
{
  "email": "test@test.com",
  "password": "pasword123"
}
```

8. If that worked, edit the IdentityPoolID and Lambda function name in client/src/config.js to match your values. Edit the S3 values as well.
9. Fire up the client!
 - `$ npm i`
 - In the client/ directory, `$ webpack -w`
 - Serve (maybe with `devd -l .` - [devd](https://github.com/cortesi/devd))
