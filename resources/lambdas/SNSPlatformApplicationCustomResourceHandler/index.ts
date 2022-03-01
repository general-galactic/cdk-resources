import 'source-map-support/register'
import { Context, CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'
import { SNSClient } from '@aws-sdk/client-sns'
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { SNSPlatformApplicationCustomResourceHandler } from './SNSPlatformApplicationCustomResourceHandler';

export async function main(event: CdkCustomResourceEvent, _context: Context): Promise<CdkCustomResourceResponse> {

    const config = {
        region: event.ResourceProperties.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN!
        }
    }

    const snsClient = new SNSClient(config)
    const secretsClient = new SecretsManagerClient(config)
 
    const handler = new SNSPlatformApplicationCustomResourceHandler({
        snsClient,
        secretsClient,
        name: event.ResourceProperties.name,
        platform: event.ResourceProperties.platform,
        attributes: event.ResourceProperties.attributes, // for passing attributes this resouce doesn't handle
        debug: event.ResourceProperties.debug === 'enabled',
        secretName: event.ResourceProperties.secretName
    })

    return await handler.handleEvent(event)
}
