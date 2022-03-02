#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IoTCorePolicyExampleStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cdk_resources_1 = require("@general-galactic/cdk-resources");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
class IoTCorePolicyExampleStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        var _a, _b, _c;
        super(scope, id, props);
        const policy = new aws_iam_1.PolicyDocument();
        policy.addStatements(new aws_iam_1.PolicyStatement({
            resources: [
                `arn:aws:iot:${aws_cdk_lib_1.Stack.of(this).region}:${aws_cdk_lib_1.Stack.of(this).account}:client/\${iot:Connection.Thing.ThingName}`
            ],
            actions: [
                'iot:Connect'
            ]
        }));
        const iotPolicy = new cdk_resources_1.IoTCorePolicy(this, 'testPolicy', policy);
        new aws_cdk_lib_1.CfnOutput(this, 'createdPolicyVersion', { value: (_a = iotPolicy.createdPolicyVersion) !== null && _a !== void 0 ? _a : '' });
        new aws_cdk_lib_1.CfnOutput(this, 'deletedPolicyVersion', { value: (_b = iotPolicy.deletedPolicyVersion) !== null && _b !== void 0 ? _b : '' });
        new aws_cdk_lib_1.CfnOutput(this, 'policyArn', { value: (_c = iotPolicy.policyArn) !== null && _c !== void 0 ? _c : '' });
    }
}
exports.IoTCorePolicyExampleStack = IoTCorePolicyExampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW9UQ29yZVBvbGljeUV4YW1wbGVTdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL0lvVENvcmVQb2xpY3lFeGFtcGxlU3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUNBLDZDQUEwRDtBQUUxRCxtRUFBK0Q7QUFDL0QsaURBQXFFO0FBRXJFLE1BQWEseUJBQTBCLFNBQVEsbUJBQUs7SUFFaEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSx3QkFBYyxFQUFFLENBQUE7UUFDbkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLHlCQUFlLENBQUM7WUFDdkMsU0FBUyxFQUFFO2dCQUNULGVBQWUsbUJBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLG1CQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sNENBQTRDO2FBQzNHO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLGFBQWE7YUFDZDtTQUNGLENBQUMsQ0FBQyxDQUFBO1FBRUgsTUFBTSxTQUFTLEdBQUcsSUFBSSw2QkFBYSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFFL0QsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFBLFNBQVMsQ0FBQyxvQkFBb0IsbUNBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUM1RixJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQUEsU0FBUyxDQUFDLG9CQUFvQixtQ0FBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQzVGLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQUEsU0FBUyxDQUFDLFNBQVMsbUNBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN4RSxDQUFDO0NBRUo7QUF0QkQsOERBc0JDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IHsgQ2ZuT3V0cHV0LCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliJ1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cydcbmltcG9ydCB7IElvVENvcmVQb2xpY3kgfSBmcm9tICdAZ2VuZXJhbC1nYWxhY3RpYy9jZGstcmVzb3VyY2VzJ1xuaW1wb3J0IHsgUG9saWN5RG9jdW1lbnQsIFBvbGljeVN0YXRlbWVudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nXG5cbmV4cG9ydCBjbGFzcyBJb1RDb3JlUG9saWN5RXhhbXBsZVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKVxuXG4gICAgICBjb25zdCBwb2xpY3kgPSBuZXcgUG9saWN5RG9jdW1lbnQoKVxuICAgICAgcG9saWN5LmFkZFN0YXRlbWVudHMobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgIGBhcm46YXdzOmlvdDoke1N0YWNrLm9mKHRoaXMpLnJlZ2lvbn06JHtTdGFjay5vZih0aGlzKS5hY2NvdW50fTpjbGllbnQvXFwke2lvdDpDb25uZWN0aW9uLlRoaW5nLlRoaW5nTmFtZX1gXG4gICAgICAgIF0sXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnaW90OkNvbm5lY3QnXG4gICAgICAgIF1cbiAgICAgIH0pKVxuICBcbiAgICAgIGNvbnN0IGlvdFBvbGljeSA9IG5ldyBJb1RDb3JlUG9saWN5KHRoaXMsICd0ZXN0UG9saWN5JywgcG9saWN5KVxuXG4gICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdjcmVhdGVkUG9saWN5VmVyc2lvbicsIHsgdmFsdWU6IGlvdFBvbGljeS5jcmVhdGVkUG9saWN5VmVyc2lvbiA/PyAnJyB9KVxuICAgICAgbmV3IENmbk91dHB1dCh0aGlzLCAnZGVsZXRlZFBvbGljeVZlcnNpb24nLCB7IHZhbHVlOiBpb3RQb2xpY3kuZGVsZXRlZFBvbGljeVZlcnNpb24gPz8gJycgfSlcbiAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ3BvbGljeUFybicsIHsgdmFsdWU6IGlvdFBvbGljeS5wb2xpY3lBcm4gPz8gJycgfSlcbiAgICB9XG5cbn1cbiJdfQ==