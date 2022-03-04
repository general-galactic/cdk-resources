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
                `arn:aws:iot:${aws_cdk_lib_1.Stack.of(this).region}:${aws_cdk_lib_1.Stack.of(this).account}:client/\${iot:Connection.Thing.ThingName}/v6`
            ],
            actions: [
                'iot:Connect'
            ]
        }));
        const iotPolicy = new cdk_resources_1.IoTCorePolicy(this, 'testPolicy', JSON.stringify(policy.toJSON()));
        new aws_cdk_lib_1.CfnOutput(this, 'createdPolicyVersion', { value: (_a = iotPolicy.createdPolicyVersion) !== null && _a !== void 0 ? _a : '' });
        new aws_cdk_lib_1.CfnOutput(this, 'deletedPolicyVersion', { value: (_b = iotPolicy.deletedPolicyVersion) !== null && _b !== void 0 ? _b : '' });
        new aws_cdk_lib_1.CfnOutput(this, 'policyArn', { value: (_c = iotPolicy.policyArn) !== null && _c !== void 0 ? _c : '' });
    }
}
exports.IoTCorePolicyExampleStack = IoTCorePolicyExampleStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW9UQ29yZVBvbGljeUV4YW1wbGVTdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL0lvVENvcmVQb2xpY3lFeGFtcGxlU3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUNBLDZDQUEwRDtBQUUxRCxtRUFBK0Q7QUFDL0QsaURBQXFFO0FBRXJFLE1BQWEseUJBQTBCLFNBQVEsbUJBQUs7SUFFaEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjs7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSx3QkFBYyxFQUFFLENBQUE7UUFDbkMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLHlCQUFlLENBQUM7WUFDdkMsU0FBUyxFQUFFO2dCQUNULGVBQWUsbUJBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLG1CQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sK0NBQStDO2FBQzlHO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLGFBQWE7YUFDZDtTQUNGLENBQUMsQ0FBQyxDQUFBO1FBRUgsTUFBTSxTQUFTLEdBQUcsSUFBSSw2QkFBYSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBRXhGLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBQSxTQUFTLENBQUMsb0JBQW9CLG1DQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDNUYsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFBLFNBQVMsQ0FBQyxvQkFBb0IsbUNBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUM1RixJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFBLFNBQVMsQ0FBQyxTQUFTLG1DQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDeEUsQ0FBQztDQUVKO0FBdEJELDhEQXNCQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCB7IENmbk91dHB1dCwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYidcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnXG5pbXBvcnQgeyBJb1RDb3JlUG9saWN5IH0gZnJvbSAnQGdlbmVyYWwtZ2FsYWN0aWMvY2RrLXJlc291cmNlcydcbmltcG9ydCB7IFBvbGljeURvY3VtZW50LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJ1xuXG5leHBvcnQgY2xhc3MgSW9UQ29yZVBvbGljeUV4YW1wbGVTdGFjayBleHRlbmRzIFN0YWNrIHtcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcylcblxuICAgICAgY29uc3QgcG9saWN5ID0gbmV3IFBvbGljeURvY3VtZW50KClcbiAgICAgIHBvbGljeS5hZGRTdGF0ZW1lbnRzKG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICBgYXJuOmF3czppb3Q6JHtTdGFjay5vZih0aGlzKS5yZWdpb259OiR7U3RhY2sub2YodGhpcykuYWNjb3VudH06Y2xpZW50L1xcJHtpb3Q6Q29ubmVjdGlvbi5UaGluZy5UaGluZ05hbWV9L3Y2YFxuICAgICAgICBdLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ2lvdDpDb25uZWN0J1xuICAgICAgICBdXG4gICAgICB9KSlcbiAgXG4gICAgICBjb25zdCBpb3RQb2xpY3kgPSBuZXcgSW9UQ29yZVBvbGljeSh0aGlzLCAndGVzdFBvbGljeScsIEpTT04uc3RyaW5naWZ5KHBvbGljeS50b0pTT04oKSkpXG5cbiAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ2NyZWF0ZWRQb2xpY3lWZXJzaW9uJywgeyB2YWx1ZTogaW90UG9saWN5LmNyZWF0ZWRQb2xpY3lWZXJzaW9uID8/ICcnIH0pXG4gICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdkZWxldGVkUG9saWN5VmVyc2lvbicsIHsgdmFsdWU6IGlvdFBvbGljeS5kZWxldGVkUG9saWN5VmVyc2lvbiA/PyAnJyB9KVxuICAgICAgbmV3IENmbk91dHB1dCh0aGlzLCAncG9saWN5QXJuJywgeyB2YWx1ZTogaW90UG9saWN5LnBvbGljeUFybiA/PyAnJyB9KVxuICAgIH1cblxufVxuIl19