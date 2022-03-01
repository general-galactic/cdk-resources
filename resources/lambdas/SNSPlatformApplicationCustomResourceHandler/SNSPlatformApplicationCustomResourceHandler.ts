import { SNSClient, CreatePlatformApplicationCommand, DeletePlatformApplicationCommand, paginateListPlatformApplications, PlatformApplication, SetPlatformApplicationAttributesCommand } from '@aws-sdk/client-sns'
import { CdkCustomResourceEvent, CdkCustomResourceResponse } from "aws-lambda"


export type SNSPlatformApplicationPlatforms = 'ADM' | 'APNS' | 'APNS_SANDBOX' | 'GCM'

export type SNSPlatformApplicationCustomResourceHandlerOptions = {
    client: SNSClient
    name: string
    platform: SNSPlatformApplicationPlatforms
    attributes?: { [key: string]: string }
    debug?: boolean
}

export class SNSPlatformApplicationCustomResourceHandler {

    private client: SNSClient
    private name: string
    private platform: SNSPlatformApplicationPlatforms
    private attributes?: { [key: string]: string }
    private debug: boolean

    constructor(options: SNSPlatformApplicationCustomResourceHandlerOptions){
        this.client = options.client
        this.name = options.name
        this.platform = options.platform
        this.attributes = options.attributes
        this.debug = options.debug ?? false
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
        const command = new CreatePlatformApplicationCommand({
            Name: this.name,
            Platform: this.platform,
            Attributes: this.attributes ?? {}
        })
        console.log('CREATING PLATFORM APPLICATION: ', this.name, this.platform, command)
        const result = await this.client.send(command)

        return this.buildResponse(`Custom::GG-SNSPlatformApplication:${this.name}:${this.platform}`, { PlatformApplicationArn: result.PlatformApplicationArn! })
    }

    async onUpdate(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.name, this.platform)
        console.log('FOUND APP - UPDATING', platformApplication.PlatformApplicationArn)

        const command = new SetPlatformApplicationAttributesCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn,
            Attributes: this.attributes ?? {}
        })

        await this.client.send(command)
        
        console.log('UPDATED', platformApplication.PlatformApplicationArn)

        return this.buildResponse(physicalResourceId, { PlatformApplicationArn: platformApplication.PlatformApplicationArn! })
    }

    async onDelete(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const platformApplication = await this.findPlatformApplicationByNameAndPlatform(this.name, this.platform)
        console.log('FOUND APP - DELETING', platformApplication.PlatformApplicationArn)

        const command = new DeletePlatformApplicationCommand({
            PlatformApplicationArn: platformApplication.PlatformApplicationArn
        })

        await this.client.send(command)

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
        const paginator = paginateListPlatformApplications({ client: this.client }, {})

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