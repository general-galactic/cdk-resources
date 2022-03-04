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

export type ResourceProperties = {
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

    private event: CdkCustomResourceEvent
    private debug: boolean

    constructor(options: SNSPlatformApplicationCustomResourceHandlerOptions, event: CdkCustomResourceEvent ){
        this.snsClient = options.snsClient
        this.secretsClient = options.secretsClient
        this.event = event
        this.debug = event.ResourceProperties.debug === 'enabled'
    }

    private log(...args: any[]){
        if(!this.debug) return 
        console.log(...args)
    }

    get eventResourceProperties(): ResourceProperties {
        return this.event.ResourceProperties as unknown as ResourceProperties
    }

    get oldEventResourceProperties(): ResourceProperties {
        const updateEvent = this.event as CloudFormationCustomResourceUpdateEvent
        return updateEvent.OldResourceProperties as unknown as ResourceProperties
    }

    private async fetchSigningKeySecret(): Promise<string> {
        const command = new GetSecretValueCommand({ SecretId: this.eventResourceProperties.signingKeySecretName })
        const result = await this.secretsClient.send(command)
        if(!result.SecretString) throw new Error(`Unable to fetch the signingKey secret. Make sure you manually created the secret: ${this.eventResourceProperties.signingKeySecretName}`)
        return result.SecretString
    }

    private async buildAttributes(): Promise<{ [key: string]: string }> {
        const attributes: { [key: string]: any } = this.event.ResourceProperties.attributes ?? {}

        if(this.eventResourceProperties.platform === 'APNS' || this.eventResourceProperties.platform === 'APNS_SANDBOX'){
            const signingKey = await this.fetchSigningKeySecret()

            attributes['PlatformCredential'] = signingKey
            attributes['PlatformPrincipal'] = this.eventResourceProperties.signingKeyId
            attributes['ApplePlatformBundleID'] = this.eventResourceProperties.appBundleId
            attributes['ApplePlatformTeamID'] = this.eventResourceProperties.teamId
        }

        this.log(`PLATFORM APPLICATION ATTRIBUTES: `, { ...attributes, PlatformCredential: '[hidden]' })

        return attributes
    }

    async handleEvent(): Promise<CdkCustomResourceResponse>{
        switch(this.event.RequestType){
            case 'Create':
                return this.onCreate()
            case 'Update':
                return this.onUpdate(this.event as CloudFormationCustomResourceUpdateEvent)
            case 'Delete':
                return this.onDelete(this.event as CloudFormationCustomResourceDeleteEvent)
        }
    }

    async onCreate(): Promise<CdkCustomResourceResponse> {
        this.log('CREATING PLATFORM APPLICATION: ', this.eventResourceProperties.name)
        const command = new CreatePlatformApplicationCommand({
            Name: this.eventResourceProperties.name,
            Platform: this.eventResourceProperties.platform,
            Attributes: await this.buildAttributes()
        })
        const result = await this.snsClient.send(command)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.eventResourceProperties.name}:${this.eventResourceProperties.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
    }

    async onUpdate(event: CloudFormationCustomResourceUpdateEvent): Promise<CdkCustomResourceResponse> {
        this.log('UPDATING PLATFORM APPLICATION', this.eventResourceProperties, this.oldEventResourceProperties)
        
        const nameChanged = this.eventResourceProperties.name !== this.oldEventResourceProperties.name

        if(nameChanged){
            return this.handleNameChange()
        }

        const platformApplication = await this.findPlatformApplicationByName(this.eventResourceProperties.name)
        if(!platformApplication){
            this.log(`No platform application found '${this.eventResourceProperties.name}': exiting silently`)
            throw new Error(`No platform application found '${this.eventResourceProperties.name}'`)
        }

        if(!platformApplication.PlatformApplicationArn){
            this.log(`No platform application arn found '${this.eventResourceProperties.name}': exiting silently`)
            throw new Error(`No platform application arn found '${this.eventResourceProperties.name}'`)
        }

        this.log('FOUND PLATFORM APPLICATION - UPDATING', this.eventResourceProperties.name, platformApplication.PlatformApplicationArn)

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

        const platformApplication = await this.findPlatformApplicationByName(this.eventResourceProperties.name)
        if(!platformApplication){
            this.log(`No platform application found '${this.eventResourceProperties.name}': exiting silently`)
            return this.buildResponse(event.PhysicalResourceId, { PlatformApplicationArn: '' })
        }

        if(!platformApplication.PlatformApplicationArn){
            this.log(`No platform application arn found '${this.eventResourceProperties.name}': exiting silently`)
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

    private async handleNameChange(): Promise<CdkCustomResourceResponse>{
        this.log(`Platform application name changed: ${this.oldEventResourceProperties.name} -> ${this.eventResourceProperties.name}. Will delete and recreate.`)

        const platformApplication = await this.findPlatformApplicationByName(this.oldEventResourceProperties.name)
        if(!platformApplication){
            this.log(`No platform application found '${this.oldEventResourceProperties.name}'`)
            throw new Error(`No platform application found '${this.oldEventResourceProperties.name}'`)
        }

        if(!platformApplication.PlatformApplicationArn){
            this.log(`No platform application arn found '${this.oldEventResourceProperties.name}'`)
            throw new Error(`No platform application arn found '${this.oldEventResourceProperties.name}'`)
        }

        // Name changes need to be deleted and recreated
        const deleteCommand = new DeletePlatformApplicationCommand({
            PlatformApplicationArn: this.oldEventResourceProperties.name
        })
        await this.snsClient.send(deleteCommand)
        this.log('DELETED PLATFORM APPLICATION: ', this.oldEventResourceProperties.name)

        const createCommand = new CreatePlatformApplicationCommand({
            Name: this.eventResourceProperties.name,
            Platform: this.eventResourceProperties.platform,
            Attributes: await this.buildAttributes()
        })
        const result = await this.snsClient.send(createCommand)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.eventResourceProperties.name}:${this.eventResourceProperties.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
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