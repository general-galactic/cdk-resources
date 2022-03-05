#!/usr/bin/env node
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { SNSPlatformApplicationAPNS, SNSPlatformApplicationFirebase } from '@general-galactic/cdk-resources'

export class SNSPlatformApplicationExampleStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props)

      const apnsPlatformApplication = new SNSPlatformApplicationAPNS(this, {
        name: 'testAPNS',
        platform: 'APNS_SANDBOX',
        debug: 'enabled',

        // Apple / APNS Specific
        signingKeyId: process.env.SNS_PLATFORM_APP_SIGNING_KEY_ID!,
        signingKeySecretName: process.env.SNS_PLATFORM_APP_SIGNING_KEY_SECRET_NAME!,
        appBundleId: process.env.SNS_PLATFORM_APP_BUNDLE_ID!,
        teamId: process.env.SNS_PLATFORM_APP_TEAM_ID!,
      })

      const firebasePlatformApplication = new SNSPlatformApplicationFirebase(this, {
        name: 'testGCM',
        platform: 'GCM',
        debug: 'enabled',

        // Firebase / GCM Specific
        firebaseCloudMessagingServerKeySecretName: process.env.FIREBASE_CLOUD_MESSAGING_SERVER_KEY_SECRET_NAME!
      })

      new CfnOutput(this, 'apnsPlatformApplication', { value: apnsPlatformApplication.PlatformApplicationArn ?? '' })
      new CfnOutput(this, 'firebasePlatformApplication', { value: firebasePlatformApplication.PlatformApplicationArn ?? '' })
    }

}
