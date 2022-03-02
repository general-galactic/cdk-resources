#!/usr/bin/env node
import 'dotenv/config'
import { App } from 'aws-cdk-lib'
import { SNSPlatformApplicationExampleStack } from './SNSPlatformApplicationExampleStack'

const app = new App()

new SNSPlatformApplicationExampleStack(app, 'SNSPlatformApplicationExample', {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION
  }
})
