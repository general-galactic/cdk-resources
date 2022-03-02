import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { AbstractSNSPlatformApplication, AbstractSNSPlatformApplicationOptions } from './AbstractSNSPlatformApplication'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'


type APNSPlatformTypes = 'APNS' | 'APNS_SANDBOX'

export type SNSPlatformApplicationAPNSOptions = AbstractSNSPlatformApplicationOptions & {
    platform: APNSPlatformTypes
    signingKeyId: string
    signingKeySecretName: string
    appBundleId: string
    teamId: string
}

export class SNSPlatformApplicationAPNS extends AbstractSNSPlatformApplication {

    readonly signingKeyId: string
    readonly signingKeySecretName: string
    readonly appBundleId: string
    readonly teamId: string
    private secret: ISecret

    constructor(scope: Construct, { name, platform, attributes, signingKeyId, signingKeySecretName, appBundleId, teamId }: SNSPlatformApplicationAPNSOptions) {
        super(scope, 'SNSPlatformApplicationAPNS', { name, platform, attributes })

        this.signingKeyId = signingKeyId
        this.signingKeySecretName = signingKeySecretName
        this.appBundleId = appBundleId
        this.teamId = teamId

        this.secret = Secret.fromSecretNameV2(this, 'Secret', this.signingKeySecretName)

        this.onEventHandler = this.setupEventHandler()
        if(this.onEventHandler.role){
            this.onEventHandler.role.addToPrincipalPolicy(new PolicyStatement({
                actions: [
                    'SNS:CreatePlatformApplication',
                    'SNS:DeletePlatformApplication',
                    'SNS:ListPlatformApplications',
                    'SNS:SetPlatformApplicationAttributes'
                ],
                resources: [
                    `arn:aws:sns:${Stack.of(this).region}:${Stack.of(this).account}:*`
                ]
            }))

            this.secret.grantRead(this.onEventHandler.role)
        }

        this.provider = this.setupProvider(this.onEventHandler)
        this.resource = this.setupResource(this.provider, 'Custom::SNSPlatformApplicationAPNS', this.buildEventHandlerProperties() )
    }

    buildEventHandlerProperties(): { [key: string]: any } {
        return {
            name: this.name,
            platform: this.platform,
            attributes: this.attributes,
            region: Stack.of(this).region,
            account: Stack.of(this).account,
            signingKeyId: this.signingKeyId,
            signingKeySecretName: this.signingKeySecretName,
            appBundleId: this.appBundleId,
            teamId: this.teamId
        }
    }
 
}