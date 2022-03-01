import { CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'
import 'source-map-support/register'
import { AWSError, Iot } from 'aws-sdk'
import { CreatePolicyResponse, CreatePolicyVersionResponse, GetPolicyResponse, ListPolicyVersionsResponse, PolicyVersion } from 'aws-sdk/clients/iot'

export class IotCorePolicyCustomResourceHandler {

    private client: Iot
    private policyName: string
    private policyDocument: string
    private debug: boolean

    constructor(client: Iot, policyName: string, policyDocument: string, debug = false){
        this.client = client
        this.policyName = policyName
        this.policyDocument = policyDocument
        this.debug = debug
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
        const policy = await this.createPolicy()
        if(!policy) throw new Error(`Unable to create policy.`)
        return this.buildResponse(`Custom::VersionedIoTPolicy:${this.policyName}`, { deletedVersion: '', createdVersion: '1', policyArn: policy.policyArn }) // create events need to create physical ids, other events are passed the PhysicalResourceId
    }

    async onUpdate(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const policy = await this.getPolicy()
        if(!policy) throw new Error(`Cannot update a policy that does not exist.`)

        const deletedVersion = await this.cleanupPolicyVersions()

        const newVersion = await this.createPolicyVersion()

        return this.buildResponse(physicalResourceId, { deletedVersion: deletedVersion ?? '', createdVersion: newVersion?.policyVersionId ?? '', policyArn: newVersion?.policyArn ?? '' })
    }

    async onDelete(physicalResourceId: string): Promise<CdkCustomResourceResponse> {
        const versions = await this.listPolicyVersions()
        for(const version of versions){
            if(!version.isDefaultVersion){ // The default version gets deleted by deletePolicy
                await this.deletePolicyVersion(version)
            }
        }
        await this.deletePolicy()
        return this.buildResponse(physicalResourceId, { deletedVersion: '*', createdVersion: '', policyArn: '' })
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

        let versionToDelete: Required<PolicyVersion> | undefined

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

        if(!await this.deletePolicyVersion(versionToDelete)){
            throw new Error(`Failed to delete policy version: ${versionToDelete.versionId}`)
        }

        if(this.debug) console.log(`Deleted policy version: ${this.policyName} -> ${versionToDelete.versionId}`)
        return versionToDelete.versionId
    }


    // AWS PROMISE WRAPPERS
    
    getPolicy(this: IotCorePolicyCustomResourceHandler): Promise<Required<GetPolicyResponse> | undefined> {
        return new Promise((resolve, reject) => {
            this.client.getPolicy({ policyName: this.policyName }, (error:AWSError, data: GetPolicyResponse) => {
                if(this.debug) console.log('Got Policy: ', error, data)
                if(error) return reject(error)
                if(data.policyName){
                    resolve(data as Required<GetPolicyResponse>)
                }
                resolve(undefined)
            })
        })
    }

    createPolicy(): Promise<Required<CreatePolicyResponse> | undefined> {
        return new Promise((resolve, reject) => {
            this.client.createPolicy({ policyName: this.policyName, policyDocument: this.policyDocument }, (error: AWSError, data: CreatePolicyResponse) => {
                if(this.debug) console.log('Created Policy: ', error, data)
                if(error) return reject(error)
                if(data.policyName){
                    resolve(data as Required<CreatePolicyResponse>)
                }
                resolve(undefined)
            })
        })
    }

    listPolicyVersions(): Promise<Required<PolicyVersion>[]> {
        return new Promise((resolve, reject) => {
            this.client.listPolicyVersions({ policyName: this.policyName }, (error: AWSError, data: ListPolicyVersionsResponse) => {
                if(this.debug) console.log('Got Policy Versions: ', error, data)
                if(error) return reject(error)
                if(data.policyVersions){
                    return resolve(data.policyVersions as Required<PolicyVersion>[])
                }
                resolve([])
            })
        })
    }

    deletePolicyVersion(policyVersion: Required<PolicyVersion>): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.deletePolicyVersion({ policyName: this.policyName, policyVersionId: policyVersion.versionId }, (error: AWSError, data: {}) => {
                if(this.debug) console.log('Delete Policy Version: ', policyVersion, error, data)
                if(error) return reject(error)
                resolve(true)
            })
        })
    }

    deletePolicy(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.client.deletePolicy({ policyName: this.policyName }, (error: AWSError, data: {}) => {
                if(this.debug) console.log('Delete Policy: ', error, data)
                if(error) return reject(error)
                resolve(true)
            })
        })
    }

    createPolicyVersion(): Promise<Required<CreatePolicyVersionResponse> | undefined> {
        return new Promise((resolve, reject) => {
            this.client.createPolicyVersion({ policyName: this.policyName, policyDocument: this.policyDocument, setAsDefault: true }, (error: AWSError, data: CreatePolicyVersionResponse) => {
                if(this.debug) console.log('Created Policy Version: ', error, data)
                if(error) return reject(error)

                if(!data.policyArn) throw new Error(`createPolicyVersion response does not contain an arn. Failed to create policy version.`)
                resolve(data as Required<CreatePolicyVersionResponse>)
            })
        })
    }

}