import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { AbstractSNSPlatformApplication, AbstractSNSPlatformApplicationOptions } from './AbstractSNSPlatformApplication'


export type SNSPlatformApplicationFirebaseOptions = AbstractSNSPlatformApplicationOptions & {
    platform: 'GCM'
    firebaseCloudMessagingServerKeySecretName: string
}

export class SNSPlatformApplicationFirebase extends AbstractSNSPlatformApplication {

    readonly firebaseCloudMessagingServerKeySecretName: string

    private secret: ISecret
    readonly debug: 'enabled' | 'disabled'

    constructor(scope: Construct, { name, platform, attributes, firebaseCloudMessagingServerKeySecretName, debug }: SNSPlatformApplicationFirebaseOptions) {
        super(scope, 'SNSPlatformApplicationFirebase', { name, platform, attributes, debug })

        this.debug = debug ?? 'disabled'
        this.firebaseCloudMessagingServerKeySecretName = firebaseCloudMessagingServerKeySecretName
    
        this.secret = Secret.fromSecretNameV2(this, 'Secret', this.firebaseCloudMessagingServerKeySecretName)

        this.onEventHandler = this.setupEventHandler()
        if(this.onEventHandler.role){
            this.secret.grantRead(this.onEventHandler.role)
        }

        this.provider = this.setupProvider(this.onEventHandler)
        this.resource = this.setupResource(this.provider, 'Custom::SNSPlatformApplicationFirebase', this.buildEventHandlerProperties() )
    }

    buildEventHandlerProperties(): { [key: string]: any } {
        return {
            name: this.name,
            platform: this.platform,
            attributes: this.attributes,
            region: Stack.of(this).region,
            account: Stack.of(this).account,
            debug: this.debug,
            firebaseCloudMessagingServerKeySecretName: this.firebaseCloudMessagingServerKeySecretName
        }
    }
 
}