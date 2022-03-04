import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { AbstractSNSPlatformApplication, AbstractSNSPlatformApplicationOptions } from './AbstractSNSPlatformApplication'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'


export type SNSPlatformApplicationAPNSOptions = AbstractSNSPlatformApplicationOptions & {
    platform: 'APNS' | 'APNS_SANDBOX'
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
    readonly debug: 'enabled' | 'disabled'

    private secret: ISecret

    constructor(scope: Construct, { name, platform, attributes, signingKeyId, signingKeySecretName, appBundleId, teamId, debug }: SNSPlatformApplicationAPNSOptions) {
        super(scope, 'SNSPlatformApplicationAPNS', { name, platform, attributes, debug })

        this.debug = debug ?? 'disabled'
        this.signingKeyId = signingKeyId
        this.signingKeySecretName = signingKeySecretName
        this.appBundleId = appBundleId
        this.teamId = teamId

        this.secret = Secret.fromSecretNameV2(this, 'Secret', this.signingKeySecretName)

        this.onEventHandler = this.setupEventHandler()
        if(this.onEventHandler.role){
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
            debug: this.debug,

            apnsSigningKeyId: this.signingKeyId,
            apnsSigningKeySecretName: this.signingKeySecretName,
            apnsAppBundleId: this.appBundleId,
            apnsTeamId: this.teamId
        }
    }
 
}