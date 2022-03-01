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

    const platform = event.ResourceProperties.platform

    const apns = !isAPNS(platform) ? undefined : {
        signingKey: event.ResourceProperties.signingKey,
        signingKeyId: event.ResourceProperties.signingKeyId,
        appBundleId: event.ResourceProperties.appBundleId,
        teamId: event.ResourceProperties.teamId
    }

    // TODO: firebase

    const handler = new SNSPlatformApplicationCustomResourceHandler({
        client,
        name: event.ResourceProperties.name,
        platform,
        apns,
        attributes: event.ResourceProperties.attributes, // for passing attributes this resouce doesn't handle
        debug: event.ResourceProperties.debug === 'enabled'
    })

    return await handler.handleEvent(event)
}

function isAPNS(platform: string){
    return platform === 'APNS' || platform === 'APNS_SANDBOX'
}
