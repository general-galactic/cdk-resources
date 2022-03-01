import { CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { IRole, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { join } from 'path'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager'


type PlatformTypes = 'ADM' | 'APNS' | 'APNS_SANDBOX' | 'GCM'

export type SNSPlatformApplicationOptions = {
    platform: PlatformTypes
    secretName: string
    attributes?: { [key: string]: string }
}

export class SNSPlatformApplication extends Construct {

    readonly name: string
    readonly platform: PlatformTypes
    readonly attributes?: { [key: string]: string }
    readonly secretName: string

    readonly provider: Provider
    readonly resource: CustomResource
    readonly secret: ISecret
    readonly role: IRole

    constructor(scope: Construct, name: string, { platform, attributes, secretName }: SNSPlatformApplicationOptions) {
        super(scope, 'SNSPlatformApplication')

        this.name = name
        this.platform = platform
        this.attributes = attributes
        this.secretName = secretName

        this.role = this.setupRole()

        const onEventHandler = this.setupEventHandler(this.role)

        this.provider = new Provider(this, 'Provider', {
            onEventHandler,
            logRetention: RetentionDays.ONE_DAY
        })


        // Allow the lambda role to access the secret to get credentials for the Platform Application
        this.secret = Secret.fromSecretNameV2(this, 'Secret', this.secretName)
        this.secret.grantRead(this.role)
        
        this.resource = new CustomResource(this, 'Resource', {
            serviceToken: this.provider.serviceToken,
            properties: {
                name: this.name,
                platform: this.platform,
                attributes: this.attributes,
                region: Stack.of(this).region,
                account: Stack.of(this).account,
                secretName: this.secretName
            },
            removalPolicy: RemovalPolicy.DESTROY,
            resourceType: 'Custom::GG-SNSPlatformApplication'
        })
    }

    private setupRole(): Role {
        return new Role(this, `Role`, {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
            ],
            inlinePolicies: {
                'ManageSNSPlatformApplications': new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: [
                                'sns:CreatePlatformApplication',
                                'sns:DeletePlatformApplication',
                                'sns:ListPlatformApplications',
                                'sns:SetPlatformApplicationAttributes'
                            ],
                            resources: [
                                `arn:aws:sns:${Stack.of(this).region}:${Stack.of(this).account}:app/*`
                            ]
                        })
                    ]
                })
            },
            description: 'Used to execute the @general-galactic/cdk-resources -> SNSPlatformApplicationCustomResourceEventHandler lamda'
        })
    }

    private setupEventHandler(role: IRole): NodejsFunction {
        return new NodejsFunction(this, `ManageSNSPlatformApplicationCustomResourceEventHandler`, {
            runtime: Runtime.NODEJS_14_X,
            memorySize: 1024,
            timeout: Duration.minutes(5),
            entry: join(__dirname, `../../../resources/lambdas/SNSPlatformApplicationCustomResourceHandler/index.js`),
            handler: 'main',
            bundling: {
              externalModules: ['aws-sdk'],
              sourceMap: true,
              sourceMapMode: SourceMapMode.INLINE,
              target: 'es2020',
              banner: '/* WARNING: THIS FILE WAS GENERATED BY THE CDK - DO NOT EDIT! */'
            },
            role,
            environment: {
              NODE_OPTIONS: '--enable-source-maps'
            },
            logRetention: RetentionDays.THREE_DAYS,
            description: 'Used to manage SNS Platform Application updates from CloudFormation / CDK -- created by @general-galactic/cdk-resources'
        })
    }

    get PlatformApplicationArn(): string | undefined {
        return this.resource?.getAttString('PlatformApplicationArn')
    }

}