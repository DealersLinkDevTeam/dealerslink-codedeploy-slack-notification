const tester = require('./index');

const deployTestData = {
  Succeeded: true,
  Failed: false,
  Skipped: false,
  InProgress: false,
  Pending: false
};

const testData = {
  eventTriggerName: 'Test-Deploy-Trigger',
  createTime: '2018-03-29T17:20:35',
  completeTime: '2018-03-29T17:20:35',
  deploymentId: 'd-XXXXXXXXX',
  region: 'us-east-1',
  deploymentGroupName: 'Test-Dev',
  accountId: '620810885860',
  applicationName: 'Test',
  status: 'CREATED',
  object: 'vehicle',
  deploymentOverview: JSON.stringify(deployTestData)
};

const data = JSON.stringify(testData);
tester.handler(
  {
    Records: [
      {
        Sns: {
          Subject: 'Test',
          Message: data
        }
      }
    ]
  },
  null,
  (res) => {
    if (res) {
      console.log(res);
    }
  },
  {}
);
