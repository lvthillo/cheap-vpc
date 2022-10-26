#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CheapVpcStack } from '../lib/cheap-vpc-stack';

const app = new cdk.App();
new CheapVpcStack(app, 'CheapVpcStack', { 
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION 
    }});
