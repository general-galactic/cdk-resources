
## Testing the IoTCorePolicy Resource

1. Run `npm i`
1. Run `tsc`
1. Run `cdk deploy IoTCorePolicyExample --profile [ the name of the AWS profile you're using - can be omitted if you're using DEFAULT ]` in `/exaxmples`


## Testing the SNSPlatformApplication Resource

### Get an APNS Signing Key

First, you'll need to log into the Apple Developer portal and create an APNS signing key for token based credentials. This process will generate a signing key which you will download.
You'll need to take the contents of the signing key id and put them into a plain-text secret in AWS Secrets Manager.

### Setup the Environment

Next, you'll need to create a `.env` file in the `examples` folder with the following keys:

```
ACCOUNT_ID=[your aws account id]
REGION=[aws region]
SNS_PLATFORM_APP_NAME=[your platform application name]
SNS_PLATFORM_APP_PLATFORM=[APNS or APNS_SANDBOX]
SNS_PLATFORM_APP_SIGNING_KEY_ID=[Your signing key id from the Apple Developer portal]
SNS_PLATFORM_APP_SIGNING_KEY_SECRET_NAME=[The name of the secret you created in AWS Secrets Manager containing the contents of your APNS signing key]
SNS_PLATFORM_APP_BUNDLE_ID=[The bundle id of your iOS app]
SNS_PLATFORM_APP_TEAM_ID=[The team id from the Apple Developer portal]
```

### Deploying

1. Run `npm i`
1. Run `tsc`
1. Run `cdk deploy SNSPlatformApplicationExample --profile [ the name of the AWS profile you're using - can be omitted if you're using DEFAULT ]` in `/exaxmples`