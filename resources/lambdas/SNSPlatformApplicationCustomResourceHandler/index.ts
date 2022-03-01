import { Context, CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'
import 'source-map-support/register'
import { SNSClient } from "@aws-sdk/client-sns"; // ES Modules import
import { SNSPlatformApplicationCustomResourceHandler } from './SNSPlatformApplicationCustomResourceHandler';

export async function main(event: CdkCustomResourceEvent, _context: Context): Promise<CdkCustomResourceResponse> {

    const client = new SNSClient({
        region: event.ResourceProperties.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN!
        }
    })

    const handler = new SNSPlatformApplicationCustomResourceHandler({
        client,
        name: event.ResourceProperties.name,
        platform: event.ResourceProperties.platform,
        attributes: event.ResourceProperties.attributes
    })

    return await handler.handleEvent(event)
}
