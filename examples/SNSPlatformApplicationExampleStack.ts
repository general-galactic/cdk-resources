#!/usr/bin/env node
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { SNSPlatformApplicationAPNS } from '@general-galactic/cdk-resources'

export class SNSPlatformApplicationExampleStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props)

      const platformApplication = new SNSPlatformApplicationAPNS(this, {
        name: process.env.SNS_PLATFORM_APP_NAME!,
        platform: process.env.SNS_PLATFORM_APP_PLATFORM! as 'APNS' | 'APNS_SANDBOX',
        signingKeyId: process.env.SNS_PLATFORM_APP_SIGNING_KEY_ID!,
        signingKeySecretName: process.env.SNS_PLATFORM_APP_SIGNING_KEY_SECRET_NAME!,
        appBundleId: process.env.SNS_PLATFORM_APP_BUNDLE_ID!,
        teamId: process.env.SNS_PLATFORM_APP_TEAM_ID!,
        debug: true
      })

      new CfnOutput(this, 'snsPlatformApplicationARN', { value: platformApplication.PlatformApplicationArn ?? '' })
    }

}
