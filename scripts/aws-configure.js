#!/usr/bin/env node

const __ = require('lodash');
const program = require('commander');
const inquirer = require('inquirer');
const modifyFiles = require('./utils');
const pack = require('../package.json');

const availableRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'sa-east-1'
];

const options = {
  region: null,
  account: null,
  stack: null,
  bucket: null,
  function: null,
  sns: null
};

const questions = [];

function performModify() {
  modifyFiles(['./package.json'],
    [{
      regexp: /("region": )"([A-Za-z0-9_-]*)",/,
      replacement: `$1"${options.region}",`
    }, {
      regexp: /("accountId": )"(\w*)",/,
      replacement: `$1"${options.account}",`
    }, {
      regexp: /("cloudFormationStackName": )"([A-Za-z0-9_-]*)"/,
      replacement: `$1"${options.stack}"`
    }, {
      regexp: /("s3BucketName": )"([A-Za-z0-9_-]*)",/,
      replacement: `$1"${options.bucket}",`
    }, {
      regexp: /("functionName": )"([A-Za-z0-9_-]*)",/,
      replacement: `$1"${options.function}",`
    }, {
      regexp: /("snsTopicName": )"([A-Za-z0-9_-]*)",/,
      replacement: `$1"${options.sns}",`
    }]
  );

  modifyFiles(['./cloudformation.yaml'],
    [{
      regexp: /^(Resources:\n  )(\w*):$/m,
      replacement: `$1${options.function}:`
    }, {
      regexp: /^(        - Endpoint: !GetAtt )(.*)$/gm,
      replacement: `$1${options.function}`
    }, {
      regexp: /^(    DependsOn: )(.*)$/gm,
      replacement: `$1${options.function}`
    }, {
      regexp: /^(      FunctionName: !Ref )(.*)$/gm,
      replacement: `$1${options.function}`
    }, {
      regexp: /^(  .*)(:\n    Type: AWS::SNS::Topic\n    Properties:)$/m,
      replacement: `  ${options.sns}$2`
    }, {
      regexp: /^(      SourceArn: !Ref )(.*)$/gm,
      replacement: `$1${options.sns}`
    }]
  );
}

function setupQuestions() {
  if (!program.region || !availableRegions.includes(program.region)) {
    questions.push({
      type: 'list',
      name: 'region',
      default: availableRegions,
      choices: availableRegions,
      message: 'Select an AWS Region:'
    });
  } else {
    options.region = program.region;
  }

  if (!program.account || program.account.length !== 12) {
    questions.push({
      type: 'input',
      name: 'account',
      message: 'Supply a 12-digit AWS Account ID:',
      validate: (v) => {
        if ((/^\w{12}$/).test(v)) {
          return true;
        } else {
          return 'Must be a valid 12 digit AWS account';
        }
      }
    });
  } else {
    options.account = program.account;
  }

  if (!program.stack) {
    questions.push({
      type: 'input',
      name: 'stack',
      message: 'Enter a CloudFormation Stack name:',
      default: 'CodeDeploySlackNotifications',
      validate: (v) => {
        if ((/^[a-zA-Z][a-zA-Z0-9]*$/).test(v)) {
          return true;
        } else {
          return 'Must be a valid bucket name. Only alphanumeric are allowed.'
        }
      }
    });
  } else {
    options.stack = program.stack;
  }

  if (!program.bucket) {
    questions.push({
      type: 'input',
      name: 'bucket',
      message: 'Enter a unique AWS S3 Bucket name for deployment:',
      default: 'codedeploy-slack-notification-bucket',
      validate: (v) => {
        if ((/^[a-z0-9_/-]*$/).test(v)) {
          return true;
        } else {
          return 'Must be a valid bucket name. Only lowercase alphanumeric, underscore, and dash are allowed.'
        }
      }
    });
  } else {
    options.bucket = program.bucket;
  }

  if (!program.sns) {
    questions.push({
      type: 'input',
      name: 'sns',
      message: 'Enter the Unique SNS Topic name:',
      default: 'Topic',
      validate: (v) => {
        if ((/^[a-zA-Z][a-zA-Z0-9]*$/).test(v)) {
          return true;
        } else {
          return 'Must be a valid queue name. Only alphanumeric are allowed and must not start with a number.'
        }
      }
    });
  } else {
    options.api = program.api;
  }

  if (!program.function) {
    questions.push({
      type: 'input',
      name: 'function',
      message: 'Enter the AWS Lambda Composite function name:',
      default: 'Function',
      validate: (v) => {
        if ((/^[a-zA-Z][a-zA-Z0-9]*$/).test(v)) {
          return true;
        } else {
          return 'Must be a valid function name. Only alphanumeric are allowed and must not start with a number.'
        }
      }
    });
  } else {
    options.function = program.function;
  }
}

function mapAnswers(answers) {
  if (answers.region) { options.region = answers.region; }
  if (answers.account) { options.account = answers.account; }
  if (answers.stack) { options.stack = answers.stack; }
  if (answers.bucket) { options.bucket = answers.bucket; }
  if (answers.sns) { options.sns = answers.sns; }
  if (answers.function) { options.function = answers.function; }
}

function doConfig() {
  setupQuestions();
  if (questions.length !== 0) {
    inquirer.prompt(questions)
    .then((answers) => {
      mapAnswers(answers);
      performModify();
    })
    .catch((err) => {
      console.error(err.stack || err);
    });
  } else {
    performModify();
  }
}

program
  .version(pack.version)
  .option('-a, --account <accountID>','The AWS Account ID to use.')
  .option('-b, --bucket <bucketName>', 'The S3 Bucket Name to configure and use. Defaults to "codedeploy-slack-notification-bucket".')
  .option('-f, --force', 'Do not ask for confirmation')
  .option(
    '-l, --function <lambdaFunctionName>',
    'The name of the Lambda function to use. Defaults to "Function"')
  .option('-r, --region <awsRegion>', 'The AWS region to use. Defaults to "us-east-1".')
  .option(
    '-s, --stack <stackName>',
    'The name of the CloudFormation stack to use. Defaults to "CodeDeploySlackNotifications"')
  .option(
    '-t, --sns <snsTopicName>',
    'The name of the SNS Topic to use. Defaults to "Topic".')
  .parse(process.argv);

if (program.force === true) {
  doConfig();
} else {
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
      doConfig();
    } else {
      console.log('Operation aborted');
    }
  })
  .catch((err) => {
    console.error(err.stack || err);
  });
}
