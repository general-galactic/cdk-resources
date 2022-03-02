import { Context, CdkCustomResourceEvent, CdkCustomResourceResponse } from 'aws-lambda'
import 'source-map-support/register'
import { IotCorePolicyCustomResourceHandler } from './IotCorePolicyCustomResourceHandler'
import { IoTClient } from '@aws-sdk/client-iot'

export async function main(event: CdkCustomResourceEvent, _context: Context): Promise<CdkCustomResourceResponse> {

    const client = new IoTClient({
        region: event.ResourceProperties.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN!
        }
    })

    const handler = new IotCorePolicyCustomResourceHandler(client, event.ResourceProperties.policyName, event.ResourceProperties.policyDocument, event.ResourceProperties.debug === 'enabled' )

    return await handler.handleEvent(event)
}
