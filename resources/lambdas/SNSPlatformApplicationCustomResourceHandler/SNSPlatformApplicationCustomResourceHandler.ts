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

export type SNSPlatformApplicationCustomResourceHandlerOptions = {
    snsClient: SNSClient,
    secretsClient: SecretsManagerClient
    name: string
    platform: SNSPlatformApplicationPlatforms
    attributes?: { [key: string]: string }
    debug?: boolean
    secretName: string
}

export class SNSPlatformApplicationCustomResourceHandler {

    private snsClient: SNSClient
    private secretsClient: SecretsManagerClient
    private name: string
    private platform: SNSPlatformApplicationPlatforms
    private attributes?: { [key: string]: string }
    private debug: boolean
    private secretName: string

    constructor(options: SNSPlatformApplicationCustomResourceHandlerOptions){
        this.snsClient = options.snsClient
        this.secretsClient = options.secretsClient
        this.name = options.name
        this.platform = options.platform
        this.attributes = options.attributes
        this.debug = options.debug ?? false
        this.secretName = options.secretName
    }

    private async fetchSecret(): Promise<string | undefined> {
        const command = new GetSecretValueCommand({ SecretId: this.secretName })
        const result = await this.secretsClient.send(command)
        return result.SecretString
    }

    private async buildAttributes(): Promise<{ [key: string]: string }> {
        const secret = await this.fetchSecret()
        if(!secret) throw new Error(`Unable to get secret value. Make sure you manually created this secret with the correct format: ${this.secretName}`)
        
        const attributes = this.attributes ?? {}
        if(this.platform === 'APNS' || this.platform === 'APNS_SANDBOX'){
            const apnsSecret = JSON.parse(secret) as APNSSecret

            if(!apnsSecret.signingKey) throw new Error(`The SNS Platform Application Resource requires the secret named '${this.secretName}' to have a 'signingKey' value that is contents of the token downloaded from the Apple Developer portal.`)
            if(!apnsSecret.signingKeyId) throw new Error(`The SNS Platform Application Resource requires the secret named '${this.secretName}' to have a 'signingKeyId' value found in the Apple Developer portal.`)
            if(!apnsSecret.appBundleId) throw new Error(`The SNS Platform Application Resource requires the secret named '${this.secretName}' to have a 'appBundleId' value from your iOS app.`)
            if(!apnsSecret.teamId) throw new Error(`The SNS Platform Application Resource requires the secret named '${this.secretName}' to have a 'teamId' value from the Apple Developer portal.`)
            
            console.log('RETRIEVED AND VALIDATED APNS SECRET', apnsSecret)

            attributes['PlatformCredential'] = apnsSecret.signingKey
            attributes['PlatformPrincipal'] = apnsSecret.signingKeyId
            attributes['ApplePlatformBundleID'] = apnsSecret.appBundleId
            attributes['ApplePlatformTeamID'] = apnsSecret.teamId
        }

        if(this.debug) console.log(`PLATFORM APPLICATION ATTRIBUTES: `, attributes)
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
        console.log('CREATING PLATFORM APPLICATION: ', this.name, this.platform)
        const command = new CreatePlatformApplicationCommand({
            Name: this.name,
            Platform: this.platform,
            Attributes: await this.buildAttributes()
        })
        console.log('CREATING PLATFORM APPLICATION - COMMAND: ', command)
        const result = await this.snsClient.send(command)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.name}:${this.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
    }

    async onUpdate(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.name, this.platform)
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
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.name, this.platform)
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