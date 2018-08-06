const tester = require('./index');

const deployTestData = {
  Succeeded: true,
  Failed: false,
  Skipped: false,
  InProgress: false,
  Pending: false
};

const testData = {
  eventTriggerName: 'Deploy',
  createTime: '2018-03-29T17:20:35',
  completeTime: '2018-03-29T17:20:35',
  deploymentId: 1,
  region: 'us-east-1',
  deploymentGroupName: 'Test-Dev',
  applicationName: 'Test',
  status: 'Success',
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
