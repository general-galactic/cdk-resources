import { SNSClient, CreatePlatformApplicationCommand, DeletePlatformApplicationCommand, paginateListPlatformApplications, PlatformApplication, SetPlatformApplicationAttributesCommand } from '@aws-sdk/client-sns'
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'


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

    private async fetchSigningKeySecret(): Promise<string> {
        const command = new GetSecretValueCommand({ SecretId: this.attributes.signingKeySecretName })
        const result = await this.secretsClient.send(command)
        if(!result.SecretString) throw new Error(`Unable to fetch the signingKey secret. Make sure you manually created the secret: ${this.attributes.signingKeySecretName}`)
        return result.SecretString
    }

    private async buildAttributes(): Promise<{ [key: string]: string }> {
        const attributes: { [key: string]: any } = this.attributes ?? {}

        if(this.attributes.platform === 'APNS' || this.attributes.platform === 'APNS_SANDBOX'){
            const signingKey = await this.fetchSigningKeySecret()

            attributes['PlatformCredential'] = signingKey
            attributes['PlatformPrincipal'] = this.attributes.signingKeyId
            attributes['ApplePlatformBundleID'] = this.attributes.appBundleId
            attributes['ApplePlatformTeamID'] = this.attributes.teamId
        }

        if(this.attributes.debug) console.log(`PLATFORM APPLICATION ATTRIBUTES: `, attributes)

        return attributes
    }

    async handleEvent(event: CdkCustomResourceEvent): Promise<CdkCustomResourceResponse>{
        switch(event.RequestType){
            case 'Create':
                return this.onCreate()
            case 'Update':
                return this.onUpdate(event.PhysicalResourceId)
            case 'Delete':
                return this.onDelete(event.PhysicalResourceId)
        }
    }

    async onCreate(): Promise<CdkCustomResourceResponse> {
        console.log('CREATING PLATFORM APPLICATION: ', this.attributes.name, this.attributes.platform)
        const command = new CreatePlatformApplicationCommand({
            Name: this.attributes.name,
            Platform: this.attributes.platform,
            Attributes: await this.buildAttributes()
        })
        console.log('CREATING PLATFORM APPLICATION - COMMAND: ', command)
        const result = await this.snsClient.send(command)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.attributes.name}:${this.attributes.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
    }

    async onUpdate(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.attributes.name, this.attributes.platform)
        console.log('FOUND APP - UPDATING', platformApplication.PlatformApplicationArn)

        const command = new SetPlatformApplicationAttributesCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn,
            Attributes: await this.buildAttributes()
        })

        await this.snsClient.send(command)
        
        console.log('UPDATED', platformApplication.PlatformApplicationArn)

        return this.buildResponse(physicalResourceId, { PlatformApplicationArn: platformApplication.PlatformApplicationArn! })
    }

    async onDelete(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.attributes.name, this.attributes.platform)
        console.log('FOUND APP - DELETING', platformApplication.PlatformApplicationArn)

        const command = new DeletePlatformApplicationCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn
        })

        await this.snsClient.send(command)

        console.log('DELETED', platformApplication.PlatformApplicationArn)

        return this.buildResponse(physicalResourceId, { PlatformApplicationArn: platformApplication.PlatformApplicationArn! })
    }

    private buildResponse(physicalResourceId: string, data?: { PlatformApplicationArn: string }): CdkCustomResourceResponse {
        return {
            PhysicalResourceId: physicalResourceId,
            Data: data
        }
    }

    private async findPlatformApplicationByNameAndPlatform(name: string, platform: SNSPlatformApplicationPlatforms): Promise<PlatformApplication> {  
        console.log('FINDING PLATFORM APP: ', name, platform)      
        const paginator = paginateListPlatformApplications({ client: this.snsClient }, {})

        let foundPlatformApplication: PlatformApplication | undefined

        for await (const page of paginator) {
            console.log("GOT PAGE OF PLATFORM APPS:", page.PlatformApplications)
            if(page.PlatformApplications){
                for(const platformApplication of page.PlatformApplications){
                    if(platformApplication.Attributes && platformApplication.Attributes.Name === name && platformApplication.Attributes.Platform === platform){
                        foundPlatformApplication = platformApplication
                        break
                    }
                }
            }
        }

        if(!foundPlatformApplication){
            throw new Error(`Platform application not found: ${name} - ${platform}`)
        }

        if(!foundPlatformApplication.PlatformApplicationArn){
            throw new Error(`Platform application does not contain its ARN: ${name} - ${platform}`)
        }

        return foundPlatformApplication
    }

}