import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { AbstractSNSPlatformApplication, AbstractSNSPlatformApplicationOptions } from './AbstractSNSPlatformApplication'
import { IRole, Role } from 'aws-cdk-lib/aws-iam'


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

    constructor(scope: Construct,  { name, platform, attributes, signingKeyId, signingKeySecretName, appBundleId, teamId }: SNSPlatformApplicationAPNSOptions) {
        super(scope, 'SNSPlatformApplicationAPNS', { name, platform, attributes,
            roleModifier: role => {
                this.secret = Secret.fromSecretNameV2(this, 'Secret', signingKeySecretName)
                this.secret.grantRead(role)
            }
        })
        this.signingKeyId = signingKeyId
        this.signingKeySecretName = signingKeySecretName
        this.appBundleId = appBundleId
        this.teamId = teamId
    }

    resourceType(): string {
        return 'Custom::SNSPlatformApplicationAPNS'
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