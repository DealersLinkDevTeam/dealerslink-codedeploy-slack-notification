# dealerslink-codedeploy-slack-notification
An AWS Lambda-SNS function that reports CodeDeploy statuses to Slack

# Table of Contents
  1. [Documentation](#documentation)
      1. [Stack](#stack)
      2. [Configuration](#config)
  2. [Appendix](#appendix)
      1. [Building on Windows](#windows)
      2. [Debugging](#debugging)

<a name="documentation"></a>
# Documentation
This micro-service uses AWS Lambda (running Node 8.10) and SNS to deliver CodeDeploy status messages delivered to SNS to an external webhook.

Additionally, when developing in Lambda-NodeJS v8.10 it is important to be mindful of [language support](https://node.green/) for NodeJS 8.10.

<a name="stack"></a>
## Stack
Stack management and configuration is handled using AWS CloudFormation which configures and provisions the resources and permissions needed for the stack (`cloudformation.yaml`).  

The service makes use of an SNS Topic hooked to CodeDeploy and an Lambda Function hooked to the SNS events.

<a name="config"></a>
## Configuration
Built in scripts are provided to aid with build and provisioning of the services. These steps should be performed in the `deploy` branch of the repository to ensure that the deployment matches existing configuration. To configure the environment, perform the following steps:

1. If it is not already, install the [AWS CLI](https://aws.amazon.com/cli/) in the staging environment (MacOS/Linux only).  For building on Windows, [see the instructions below](#windows),
2. Clone the git repo:
```shell
$ git clone https://github.com/DealersLinkDevTeam/dealerslink-advanced-image-service.git
$ cd dealerslink-advanced-image-service
```
3. Run the base configurator*:
```shell
$ npm run config
```
4. Run the AWS configurator:
```shell
$ npm run aws-config
```
5. Run the Setup:
```shell
$ npm run setup
```

To revert the configuration to defaults, perform the following:

1. Run the AWS deconfigurator:
```shell
$ npm run aws-deconfig
```
2. Run the deconfigurator:
```shell
$ npm run deconfig
```

To tear down a deployment, perform the following:

1. Run the teardown command:
```shell
$ npm run delete-stack
```

<a name="appendix"></a>
# Appendix

<a name="windows"></a>
## Building on Windows
Building on Windows can only be done reliably with Windows 10 using the Linux Subsystem for Windows and Linux Distro that has been build to run within it.  Use the following instructions to install it.

1. Install [Linux Subsystem for Windows](https://docs.microsoft.com/en-us/windows/wsl/install-win10).
2. Follow the instructions in the guild to install a Linux distribution. I recommend Ubuntu, as the remaining instructions are provided using this.
3. Open the terminal for the freshly installed distribution, and install [`nvm`](https://www.liquidweb.com/kb/how-to-install-nvm-node-version-manager-for-node-js-on-ubuntu-12-04-lts/)
4. Use `nvm` to install Node v8.10 -- `nvm install 8.10; nvm use 8.10`
5. Now running node from the Linux terminal should be the Ubuntu specific version. You can check by running `node --version`
6. Install Python and Git for your Distribution.  For Ubuntu run `sudo apt-get install python git`.
7. Use `pip` (comes with Python) to install the AWS command line tools -- `pip install --upgrade awscli aws-sam-cli`

Once Node, Python, Git, and the AWS tools are installed, you can complete any native build steps as outlined above from the Linux Terminal.

<a name="debugging"></a>
## Local Debugging
Debugging uses Docker, [docker-lambda](https://github.com/lambci/docker-lambda), and [AWS SAM](https://github.com/awslabs/aws-sam-local)

1. Ensure that [Docker](https://www.docker.com/), [AWS SAM](https://github.com/awslabs/aws-sam-local), and the [AWS CLI](https://aws.amazon.com/cli) are installed locally.
2. Docker will need to be started and running.
3. You will need to run the AWS Package command to bundle your CloudFormation package.
4. Run the SAM command to start the API locally.
```shell
$ sam local invoke -t <template-package.yml>
```
