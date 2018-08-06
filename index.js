const __ = require('@dealerslink/lodash-extended');
const config = require('./config/config');
const defaults = require('./config/default.config');
const baseConfig = __.merge(Object.assign({}, defaults), config);
const pkg = require('./package.json');

const https = require('https');
const util = require('util');
const url = require('url');

const dangerMessages = [
  ' but with errors',
  ' to RED',
  'During an aborted deployment',
  'FAILED',
  'Failed to deploy application',
  'Failed to deploy configuration',
  'has a dependent object',
  'is not authorized to perform',
  'Pending to Degraded',
  'Stack deletion failed',
  'Unsuccessful command execution',
  'You do not have permission',
  'Your quota allows for 0 more running instance'
];

const warningMessages = [
  ' aborted operation.',
  ' to YELLOW',
  'Adding instance ',
  'Degraded to Info',
  'Deleting SNS topic',
  'is currently running under desired capacity',
  'Ok to Info',
  'Ok to Warning',
  'Pending Initialization',
  'Removed instance ',
  'Rollback of environment'
];

const severities = {
  good: 0,
  warning: 1,
  danger: 2
};

class SlackNotifier {
  constructor(event, context, callback, options) {
    this.options = __.merge({ ignoreQueue: false }, options || {});
    this.event = event;
    this.context = context;
    this.callback = callback;

    this.hookChannel = this.options.hookChannel || config.hookChannel || 'general';
    this.hookURL = this.options.hookURL || config.hookURL;
  }

  formatFields(str) {
    let message = JSON.parse(str);
    const fields  = [];
    let deploymentOverview;

    try {
      message = JSON.parse(str);
    } catch (ex) {
      message = str;
    }

    // Make sure we have a valid response
    if (message) {
      if (typeof messsage === 'object') {
        fields.push(
          { title: 'Task', value: message.eventTriggerName, short: true },
          { title: 'Status', value: message.status, short: true },
          { title: 'Application', value: message.applicationName, short: true },
          { title: 'Deployment Group', value: message.deploymentGroupName, short: true },
          { title: 'Region', value: message.region, short: true },
          { title: 'Deployment Id', value: message.deploymentId, short: true },
          { title: 'Create Time', value: message.createTime, short: true },
          { title: 'Complete Time', value: ((message.completeTime) ? message.completeTime : ''), short: true }
        );

        if (message.deploymentOverview) {
          deploymentOverview = JSON.parse(message.deploymentOverview);
          fields.push(
            { title: 'Succeeded', value: deploymentOverview.Succeeded, short: true },
            { title: 'Failed', value: deploymentOverview.Failed, short: true },
            { title: 'Skipped', value: deploymentOverview.Skipped, short: true },
            { title: 'In Progress', value: deploymentOverview.InProgress, short: true },
            { title: 'Pending', value: deploymentOverview.Pending, short: true }
          );
        }
      } else if (typeof message === 'string') {
        fields.push(message);
      }
    }

    return fields;
  }

  work(done) {
    let record, sns;
    console.log(JSON.stringify(this.event));
    console.log(typeof this.event);

    // Skip if the event is empty or unset
    if (!this.event || __.isUnset(this.event.Records)) {
      done(null, 'No Records');
      return;
    } else {
      record = this.event.Records[0];
      if (__.isUnset(record.Sns)) {
        done(null, 'No SNS Information');
        return;
      }
      sns = record.Sns;
    }

    const postData = {
      channel: `#${this.hookChannel}`,
      username: 'CodeDeploy Status',
      text: `* ${sns.Subject} *`,
      icon_emoji: ':aws:',
      attachments: []
    };

    const fields = this.formatFields(sns.Message);
    const messages = sns.Message;
    let severity = severities.good;

    for (let idx in messages) {
      if (messages.hasOwnProperty(idx)) {
        let msg = messages[idx];
        if (dangerMessages.includes(msg)) {
          severity |= severities.danger;
        } else if (warningMessages.includes(msg)) {
          severity |= severities.warning;
        }
      }
    }

    let color = 'good';
    if ((severity & severities.danger) === severities.danger) {
      color = 'danger';
    } else if ((severity & severities.warning) === severities.warning) {
      color = 'warning';
    }

    postData.attachments.push({ color: severity, fields: fields });
    let service = url.parse(this.hookURL);

    let options = {
      method: 'POST',
      hostname: service.hostname,
      path: service.pathname
    };

    console.log(`Sending Request to ${this.hookURL}`);

    let req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        done(null);
      });
    });

    req.on('error', function(e) {
      done(null, `Problem with request: ${e.message}`);
    });

    req.write(util.format('%j', postData));
    req.end();
  }

  startup() {
    this.work((data, err) => {
      console.log('Data Sent');
      console.log(data);
      if (err) {
        console.log(err);
      }
    });
  }
}

exports.handler = function(event, context, callback, options) {
  const notifier = new SlackNotifier(event, context, callback, options);
  notifier.startup();
};
