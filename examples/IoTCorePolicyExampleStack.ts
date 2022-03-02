#!/usr/bin/env node
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IoTCorePolicy } from '@general-galactic/cdk-resources'
import { PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class IoTCorePolicyExampleStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props)

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

      new CfnOutput(this, 'createdPolicyVersion', { value: iotPolicy.createdPolicyVersion ?? '' })
      new CfnOutput(this, 'deletedPolicyVersion', { value: iotPolicy.deletedPolicyVersion ?? '' })
      new CfnOutput(this, 'policyArn', { value: iotPolicy.policyArn ?? '' })
    }

}
