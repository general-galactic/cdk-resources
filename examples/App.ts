#!/usr/bin/env node
import 'dotenv/config'
import { App } from 'aws-cdk-lib'
import { SNSPlatformApplicationExampleStack } from './SNSPlatformApplicationExampleStack'
import { IoTCorePolicyExampleStack } from './IoTCorePolicyExampleStack'

const app = new App()

new SNSPlatformApplicationExampleStack(app, 'SNSPlatformApplicationExample', {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION
  }
})


new IoTCorePolicyExampleStack(app, 'IoTCorePolicyExample', {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION
  }
})