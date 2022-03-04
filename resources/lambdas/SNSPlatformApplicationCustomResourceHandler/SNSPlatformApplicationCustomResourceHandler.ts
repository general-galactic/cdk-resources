import { SNSClient, CreatePlatformApplicationCommand, DeletePlatformApplicationCommand, paginateListPlatformApplications, PlatformApplication, SetPlatformApplicationAttributesCommand } from '@aws-sdk/client-sns'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { CdkCustomResourceEvent, CdkCustomResourceResponse, CloudFormationCustomResourceDeleteEvent, CloudFormationCustomResourceUpdateEvent } from 'aws-lambda'


type SNSPlatformApplicationPlatforms = 'ADM' | 'APNS' | 'APNS_SANDBOX' | 'GCM'

type APNSSecret = {
    signingKey: string
    signingKeyId: string
    appBundleId: string
    teamId: string
}

export type ResourceAttributes = {
    name: string
    platform: SNSPlatformApplicationPlatforms
    attributes: { [key: string]: any },
    region: string
    account: string
    signingKeyId: string
    signingKeySecretName: string
    appBundleId: string
    teamId: string
    debug: boolean
}

export type SNSPlatformApplicationCustomResourceHandlerOptions = {
    snsClient: SNSClient,
    secretsClient: SecretsManagerClient
}

export class SNSPlatformApplicationCustomResourceHandler {

    private snsClient: SNSClient
    private secretsClient: SecretsManagerClient
    private attributes: ResourceAttributes

    constructor(options: SNSPlatformApplicationCustomResourceHandlerOptions, attributes: ResourceAttributes){
        this.snsClient = options.snsClient
        this.secretsClient = options.secretsClient
        this.attributes = attributes
    }

    private log(...args: any[]){
        if(!this.attributes.debug) return 
        console.log(...args)
    }

    private async fetchSigningKeySecret(): Promise<string> {
        const command = new GetSecretValueCommand({ SecretId: this.attributes.signingKeySecretName })
        const result = await this.secretsClient.send(command)
        if(!result.SecretString) throw new Error(`Unable to fetch the signingKey secret. Make sure you manually created the secret: ${this.attributes.signingKeySecretName}`)
        return result.SecretString
    }

    private async buildAttributes(): Promise<{ [key: string]: string }> {
        const attributes: { [key: string]: any } = this.attributes.attributes ?? {}

        if(this.attributes.platform === 'APNS' || this.attributes.platform === 'APNS_SANDBOX'){
            const signingKey = await this.fetchSigningKeySecret()

            attributes['PlatformCredential'] = signingKey
            attributes['PlatformPrincipal'] = this.attributes.signingKeyId
            attributes['ApplePlatformBundleID'] = this.attributes.appBundleId
            attributes['ApplePlatformTeamID'] = this.attributes.teamId
        }

        this.log(`PLATFORM APPLICATION ATTRIBUTES: `, { ...attributes, PlatformCredential: '[hidden]' })

        return attributes
    }

    async handleEvent(event: CdkCustomResourceEvent): Promise<CdkCustomResourceResponse>{
        switch(event.RequestType){
            case 'Create':
                return this.onCreate()
            case 'Update':
                return this.onUpdate(event as CloudFormationCustomResourceUpdateEvent)
            case 'Delete':
                return this.onDelete(event as CloudFormationCustomResourceDeleteEvent)
        }
    }

    async onCreate(): Promise<CdkCustomResourceResponse> {
        this.log('CREATING PLATFORM APPLICATION: ', this.attributes.name)
        const command = new CreatePlatformApplicationCommand({
            Name: this.attributes.name,
            Platform: this.attributes.platform,
            Attributes: await this.buildAttributes()
        })
        const result = await this.snsClient.send(command)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.attributes.name}:${this.attributes.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
    }

    async onUpdate(event: CloudFormationCustomResourceUpdateEvent): Promise<CdkCustomResourceResponse> {
        this.log('UPDATING PLATFORM APPLICATION', event.ResourceProperties, event.OldResourceProperties)
        
        const platformApplication = await this.findPlatformApplicationByName(this.attributes.name)
        if(!platformApplication){
            this.log(`No platform application found '${this.attributes.name}': exiting silently`)
            return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: '' })
        }

        if(!platformApplication.PlatformApplicationArn){
            this.log(`No platform application arn found '${this.attributes.name}': exiting silently`)
            return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: '' })
        }

        this.log('FOUND PLATFORM APPLICATION - UPDATING', platformApplication.PlatformApplicationArn)

        const command = new SetPlatformApplicationAttributesCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn,
            Attributes: await this.buildAttributes()
        })

        await this.snsClient.send(command)
        
        this.log('UPDATED PLATFORM APPLICATION', platformApplication.PlatformApplicationArn)

        return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: platformApplication.PlatformApplicationArn! })
    }

    async onDelete(event: CloudFormationCustomResourceDeleteEvent): Promise<CdkCustomResourceResponse> {
        this.log('DELETING PLATFORM APPLICATION', event.ResourceProperties)

        const platformApplication = await this.findPlatformApplicationByName(this.attributes.name)
        if(!platformApplication){
            this.log(`No platform application found '${this.attributes.name}': exiting silently`)
            return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: '' })
        }

        if(!platformApplication.PlatformApplicationArn){
            this.log(`No platform application arn found '${this.attributes.name}': exiting silently`)
            return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: '' })
        }

        this.log('FOUND PLATFORM APPLICATION - DELETING', platformApplication.PlatformApplicationArn)

        const command = new DeletePlatformApplicationCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn
        })

        await this.snsClient.send(command)

        this.log('DELETED PLATFORM APPLICATION', platformApplication.PlatformApplicationArn)

        return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: platformApplication.PlatformApplicationArn! })
    }

    private buildResponse(physicalResourceId: string, data?: { PlatformApplicationArn: string }): CdkCustomResourceResponse {
        return {
            PhysicalResourceId: physicalResourceId,
            Data: data
        }
    }

    private async findPlatformApplicationByName(name: string): Promise<PlatformApplication | undefined> {  
        this.log('FINDING PLATFORM APPLICATION: ', name)      
        const paginator = paginateListPlatformApplications({ client: this.snsClient }, {})

        let foundPlatformApplication: PlatformApplication | undefined

        for await (const page of paginator) {
            if(page.PlatformApplications){
                for(const platformApplication of page.PlatformApplications){
                    this.log("CHECKING PLATFORM APPLICATION:", platformApplication.PlatformApplicationArn)

                    if(platformApplication.PlatformApplicationArn?.endsWith(name)){
                        foundPlatformApplication = platformApplication
                        break
                    }
                }
            }
        }

        return foundPlatformApplication
    }

}