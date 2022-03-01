# cdk-resources
Custom resources for AWS CDK


## SNSPlatformApplication

This resource can be used to create an SNS Mobile Platform Application to allow sending Apple Push Notifications Service (APNs). In order to use this
resource you must first log into the Apple Developer portal and generate a new APNs key. You then need to store the key itself and a few other values
into AWS Secrets Manager:

- **signingKey**: The contents of the downloaded APNs key ( NOTE: Secrets Manager will munge the new lines and the new lines must be preserved. Enter this value in plain text mode. )
- **signingKeyId**: The signing key ID displayed in the Apple Delveloper Portal
- **appBundleId**: The bundle Id of your iOS app
- **teamId**: The Team ID found in the Apple Developer Portal under 'Membership'


Once you've stored these values in AWS Secrets Manager, you can use this resource to create a Platform Application:

```
const apnsPlatformApplication = new SNSPlatformApplication(this, '[provide name here]', {
    platform: 'APNS_SANDBOX', // or 'APNS'
    secretName: 'apns-signing-key' // The name of the secret you created above
})
```

This Resource will create several entities in AWS:

- **Event Handler Lambda**: This lambda is used by the resource to perform the actual work of creating, updating, and deleting the platform application.
- **Cloudwatch Log Groups**: You'll see log groups created for the event handler lambda and the custom resource itself. These logs can assist in troubleshooting.
- **IAM Role**: You'll find an IAM role used to execute the Event Handler Lambda. This role will have permissions to execute the lambda, access the secret in Secrets Manager, and manage SNS Platform Applications.
- **SNS Platform Application**: The Platform Application you wanted to create.

Do not delete or edit any of these resources outside of your CDK stack or you will cause yourself headaches.
