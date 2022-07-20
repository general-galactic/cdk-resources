import 'source-map-support/register'
import { CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'
import { IoTClient, CreatePolicyCommand, GetPolicyCommand, ListPolicyVersionsCommand, DeletePolicyVersionCommand, DeletePolicyCommand, CreatePolicyVersionCommand } from '@aws-sdk/client-iot'

export class IotCorePolicyCustomResourceHandler {

    private client: IoTClient
    private policyName: string
    private policyDocument: string
    private debug: boolean

    constructor(client: IoTClient, policyName: string, policyDocument: string, debug = false){
        this.client = client
        this.policyName = policyName
        this.policyDocument = policyDocument
        this.debug = debug
    }

    async handleEvent(event: CdkCustomResourceEvent): Promise<CdkCustomResourceResponse>{
        switch(event.RequestType){
            case 'Create':
                return this.onCreate(event.RequestId)
            case 'Update':
                return this.onUpdate(event.PhysicalResourceId)
            case 'Delete':
                return this.onDelete(event.PhysicalResourceId)
        }
    }

    async onCreate(requestId: string): Promise<CdkCustomResourceResponse> {
        const policy = await this.createPolicy()
        if(!policy) throw new Error(`Unable to create policy.`)
        return this.buildResponse(`Custom::VersionedIoTPolicy:${this.policyName}:${requestId}`, { deletedVersion: '', createdVersion: policy.version, policyArn: policy.policyArn })
    }

    async onUpdate(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const policy = await this.getPolicy()
        if(!policy) throw new Error(`Cannot update a policy that does not exist.`)

        const deletedVersion = await this.cleanupPolicyVersions()

        const newVersion = await this.createPolicyVersion()

        return this.buildResponse(physicalResourceId, { deletedVersion: deletedVersion ?? '', createdVersion: newVersion?.versionId ?? '', policyArn: newVersion?.policyArn ?? '' })
    }

    async onDelete(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const versions = await this.listPolicyVersions()
        for(const version of versions){
            if(!version.isDefaultVersion){ // The default version gets deleted by deletePolicy
                await this.deletePolicyVersion(version.versionId)
            }
        }
        await this.deletePolicy()
        return this.buildResponse(physicalResourceId, { deletedVersion: '*', createdVersion: '', policyArn: '' })
    }

    private log(...args: any[]){
        if(!this.debug) return 
        console.log(...args)
    }

    buildResponse(physicalResourceId: string, data?: { deletedVersion: string, createdVersion: string, policyArn: string }): CdkCustomResourceResponse {
        return {
            PhysicalResourceId: physicalResourceId,
            Data: data
        }
    }

    /**
     * Cleans up oldest policy version
     * @returns {string | undefined} policy version which was deleted. undefined if no policy was deleted
     */
    async cleanupPolicyVersions(): Promise<string | undefined> {
        const versions = await this.listPolicyVersions()
        if(versions.length < 5) return undefined

        let versionToDelete: { versionId: string, isDefaultVersion: boolean } | undefined

        for( const version of versions){
            if(versionToDelete === undefined || parseInt(version.versionId, 10) < parseInt(versionToDelete.versionId, 10)){
                versionToDelete = version
            }
        }

        if(!versionToDelete){
            throw new Error(`Cannot cleanup versions because a candidate to delete was not identified`)
        }

        if(versionToDelete.isDefaultVersion){
            throw new Error(`Cannot delete version: ${versionToDelete.versionId} because it is the default version.`)
        }

        if(!await this.deletePolicyVersion(versionToDelete.versionId)){
            throw new Error(`Failed to delete policy version: ${versionToDelete.versionId}`)
        }

        this.log(`Deleted policy version: ${this.policyName} -> ${versionToDelete.versionId}`)
        return versionToDelete.versionId
    }


    // AWS PROMISE WRAPPERS
    
    async getPolicy(this: IotCorePolicyCustomResourceHandler): Promise<Required<{ policyArn: string, version: string }> | undefined> {
        const command = new GetPolicyCommand({
            policyName: this.policyName
        })

        const result = await this.client.send(command)

        return {
            policyArn: result.policyArn!,
            version: result.defaultVersionId!
        }
    }

    async createPolicy(): Promise<Required<{ policyArn: string, version: string }> | undefined> {
        const command = new CreatePolicyCommand({
            policyName: this.policyName,
            policyDocument: this.policyDocument
        })

        const result = await this.client.send(command)

        return {
            policyArn: result.policyArn!,
            version: result.policyVersionId!
        }
    }

    async listPolicyVersions(): Promise<{ versionId: string, isDefaultVersion: boolean}[]> {
        const command = new ListPolicyVersionsCommand({
            policyName: this.policyName
        })

        const result = await this.client.send(command)
        result.policyVersions

        if(!result.policyVersions) return []
        return result.policyVersions.map( v => {
            return { versionId: v.versionId!, isDefaultVersion: v.isDefaultVersion ?? false }
        })
    }

    async deletePolicyVersion(policyVersionId: string): Promise<boolean> {
        const command = new DeletePolicyVersionCommand({
            policyName: this.policyName,
            policyVersionId
        })

        await this.client.send(command)
        this.log('Deleted Policy Version: ', policyVersionId)

        return true
    }

    async deletePolicy(): Promise<boolean> {
        const command = new DeletePolicyCommand({
            policyName: this.policyName
        })

        await this.client.send(command)
        this.log('Deleted Policy')

        return true
    }

    async createPolicyVersion(): Promise<{ policyArn: string, versionId: string } | undefined> {
        const command = new CreatePolicyVersionCommand({
            policyName: this.policyName,
            policyDocument: this.policyDocument,
            setAsDefault: true
        })

        const result = await this.client.send(command)
        this.log('Created Policy Version: ', result)

        return {
            versionId: result.policyVersionId!,
            policyArn: result.policyArn!
        }
    }

}