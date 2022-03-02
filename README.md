# cdk-resources

Custom resources for AWS CDK. Install this module into your CDK stack: `npm install @general-galactic/cdk-resources` and use the resources as seen below.

## IoTCorePolicy

This resource can be used to manage IoT Core policies. The CDK version of IoT Core policies does not support policy versions.
This resource supports version by allowing maintaining the last 5 versions. When you create a new version it is automatically
marked as the default version. When you have more than 5 versions the oldest one will be deleted. When destroying your stack, this
resouce will delete all of the policy versions and the policy itself.

Here's how to use it:
```
import { IoTCorePolicy } from '@general-galactic/cdk-resources'

...

// Build your own policy document with all of your topics and allowed actions
 const policy = new PolicyDocument()
    policy.addStatements(new PolicyStatement({
    resources: [
        `arn:aws:iot:${Stack.of(this).region}:${Stack.of(this).account}:client/\${iot:Connection.Thing.ThingName}`
    ],
    actions: [
        'iot:Connect'
    ]
}))

const iotPolicy = new IoTCorePolicy(this, 'testPolicy', policy)
```

This Resource will create several entities in AWS:

- **Event Handler Lambda**: This lambda is used by the resource to perform the actual work of creating, updating, and deleting the policies and versions.
- **Cloudwatch Log Groups**: You'll see log groups created for the event handler lambda and the custom resource itself. These logs can assist in troubleshooting.
- **IAM Role**: You'll find an IAM role used to execute the Event Handler Lambda. This role will have permissions to execute the lambda and manage policies and policy versions.
- **IoT Core Policy**: The policy you are managing.

Do not delete or edit any of these resources outside of your CDK stack or you will cause yourself headaches.

### Outputs

- **createdPolicyVersion** - The policy version created if a version was created
- **deletedPolicyVersion** - The policy version deleted if a version was deleted ( > than 5 versions )
- **policyArn** - The ARN of your IoT Core policy


## SNSPlatformApplication

This resource can be used to create an SNS Mobile Platform Application to allow sending Apple Push Notifications Service (APNs). In order to use this
resource you must first log into the Apple Developer portal and generate a new APNs key. You then need to store the key in AWS Secrets Manager as plain text.

Once you've stored the key in AWS Secrets Manager, you can use this resource to create a Platform Application:

```
import { SNSPlatformApplicationAPNS } from '@general-galactic/cdk-resources'

...

const apnsPlatformApplication = new SNSPlatformApplicationAPNS(this, '[provide name here]', {
    platform: 'APNS_SANDBOX', // or APNS
    signingKeySecretName: [the name of the signing key secret you stored above],
    signingKeyId: [The signing key ID displayed in the Apple Delveloper Portal],
    appBundleId: [The bundle Id of your iOS app],
    teamId:[The Team ID found in the Apple Developer Portal under 'Membership']
})
```

This Resource will create several entities in AWS:

- **Event Handler Lambda**: This lambda is used by the resource to perform the actual work of creating, updating, and deleting the platform application.
- **Cloudwatch Log Groups**: You'll see log groups created for the event handler lambda and the custom resource itself. These logs can assist in troubleshooting.
- **IAM Role**: You'll find an IAM role used to execute the Event Handler Lambda. This role will have permissions to execute the lambda, access the secret in Secrets Manager, and manage SNS Platform Applications.
- **SNS Platform Application**: The Platform Application you wanted to create.

Do not delete or edit any of these resources outside of your CDK stack or you will cause yourself headaches.

### Outputs

- **PlatformApplicationArn** - The ARN of the managed SNS Platform Application
