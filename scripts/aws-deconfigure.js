#!/usr/bin/env node

const inquirer = require('inquirer');
const modifyFiles = require('./utils')
const packageJson = require('../package.json')
const config = packageJson.config

const defaults = {
  region: 'YOUR_AWS_REGION',
  account: 'YOUR_ACCOUNT_ID',
  stack: 'YOUR_CLOUDFORMATION_STACK_NAME',
  bucket: 'YOUR_UNIQUE_BUCKET_NAME',
  function: 'YOUR_LAMBDA_FUNCTION_NAME',
  sns: 'YOUR_SNS_TOPIC_NAME'
};

inquirer.prompt([
  {
    type: 'confirm',
    name: 'ok',
    default: false,
    message: 'You are about to destroy the current aws configuration. Are you sure?'
  }
])
.then((answers) => {
  if (answers.ok) {
    modifyFiles(['./package.json'],
      [{
        regexp: /("region": )"([A-Za-z0-9_-]*)",/,
        replacement: `$1"${defaults.region}",`
      }, {
        regexp: /("accountId": )"(\w*)",/,
        replacement: `$1"${defaults.account}",`
      }, {
        regexp: /("cloudFormationStackName": )"([A-Za-z0-9_-]*)"/,
        replacement: `$1"${defaults.stack}"`
      }, {
        regexp: /("s3BucketName": )"([A-Za-z0-9_-]*)",/,
        replacement: `$1"${defaults.bucket}",`
      }, {
        regexp: /("functionName": )"([A-Za-z0-9_-]*)",/,
        replacement: `$1"${defaults.function}",`
      }, {
        regexp: /("snsTopicName": )"([A-Za-z0-9_-]*)",/,
        replacement: `$1"${defaults.sns}",`
      }]
    );

    modifyFiles(['./cloudformation.yaml'],
      [{
        regexp: /^(Resources:\n  )(\w*):$/m,
        replacement: `$1${defaults.function}:`
      }, {
        regexp: /^(        - Endpoint: !GetAtt )(.*)$/gm,
        replacement: `$1${defaults.function}`
      }, {
        regexp: /^(    DependsOn: )(.*)$/gm,
        replacement: `$1${defaults.function}`
      }, {
        regexp: /^(      FunctionName: !Ref )(.*)$/gm,
        replacement: `$1${defaults.function}`
      }, {
        regexp: /^(  .*)(:\n    Type: AWS::SNS::Topic\n    Properties:)$/m,
        replacement: `  ${defaults.sns}$2`
      }, {
        regexp: /^(      SourceArn: !Ref )(.*)$/gm,
        replacement: `$1${defaults.sns}`
      }]
    );
  } else {
    console.log('Operation aborted');
  }
})
.catch((err) => {
  console.error(err.stack || err);
});
