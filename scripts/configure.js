#!/usr/bin/env node
const config = require('../config/config');
const baseConfig = require('../config/default.config');

const __ = require('@dealerslink/lodash-extended');
const fs = require('fs')
const inquirer = require('inquirer');
const validate = require('./validate');

const configFile = './config/config.js';

let conf = __.merge(config, baseConfig);

const questions = [];

function validateInt(val) {
  return validate(val, 'int');
}

function setupQuestions() {
  questions.push({
    type: 'input',
    name: 'hookChannel',
    default: conf.hookChannel,
    message: 'Enter the slack channel to push notifications:',
    validate: (val) => {
      if (val.substr(0,1) === '#') {
        return 'Please omit starting #';
      }
      return true;
    }
  });

  questions.push({
    type: 'input',
    name: 'hookURL',
    default: conf.hookURL,
    message: 'Enter the hook URL:',
  });
}

function mapAnswers(answers) {
  conf = {
    hookChannel: answers.hookChannel,
    hookURL: answers.hookURL
  };
}

function doConfig() {
  setupQuestions();
  inquirer.prompt(questions)
  .then((answers) => {
    mapAnswers(answers);
    fs.writeFileSync(configFile, `module.exports = ${JSON.stringify(conf, null, 2)}`);
  })
  .catch((err) => {
    console.error(err.stack || err);
  })
}

inquirer.prompt([
  {
    type: 'confirm',
    name: 'ok',
    default: false,
    message: 'This option will overwrite your existing configuration. Are you sure?'
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
