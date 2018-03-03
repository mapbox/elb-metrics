[![CircleCI](https://circleci.com/gh/mapbox/elb-metrics.svg?style=svg)](https://circleci.com/gh/mapbox/elb-metrics)
# elb-metrics
Node module which collects metrics from the [ElasticLoadBalacer](docs.aws.amazon.com/elasticloadbalancing/latest/APIReference/Welcome.html) and makes assertions about the performance of the stack, by calculating the number of requests that were 2xxs, 3xxs, 4xxs, 5xxs and the time taken to get back a response (latency). 

#### Install 

```
git clone git@github.com:mapbox/elb-metrics.git
cd elb-metrics
npm install 
npm link 

```

You can use `elb-metrics` as a command line tool:

```
usage: elb-metrics --startTime --endTime --region --elbname

```
Note: The options you provide for the `startTime` and `endTime` should be unix timestamps. The region refers to the region of ElasticLoadBalancer you require the details for. The elbname refers to the name of the ElasticLoadBalancer which you can get by searching the AWS console. 


#### Tests

After cloning and installing `elb-metrics` you can run tests by running: 

```
npm test

```
