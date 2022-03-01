# cdk-resources
Custom resources for AWS CDK


## SNSPlatformApplication

This resource can be used to create an SNS Mobile Platform Application to allow sending Apple Push Notifications Service (APNs). In order to use this
resource you must first log into the Apple Developer portal and generate a new APNs key. You then need to store the key itself and a few other values
into AWS Secrets Manager:

- **signingKey**: The contents of the downloaded APNs key
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

