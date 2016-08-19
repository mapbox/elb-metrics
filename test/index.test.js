'use strict';
var metrics = require('../index');
var tape = require('tape');
var AWS = require('aws-sdk-mock');
var getMetrics = metrics.getMetrics;
var datapoints = require('./fixture/cloudwatch_datapoints.json');

tape('mocking [ELB]', function (assert) {
    AWS.mock('CloudWatch', 'getMetricStatistics', function (params, callback) {
        var expected = {
            EndTime: '2016-08-19T13:05:56.556Z',
            MetricName: 'Latency',
            Namespace: 'AWS/ELB',
            Period: 60,
            StartTime: '2016-08-19T13:05:56.556Z',
            Statistics: ['Sum', 'Average'],
            Dimensions: [
                {
                    Name: 'LoadBalancerName',
                    Value: 'abc'
                }
            ],
            Unit: 'Seconds'
        };
        assert.deepEquals(params, expected, 'ok parameters equal');
        callback(null, datapoints);
    });
    assert.end();
});
tape('ELB metrics', function (assert) {
    getMetrics('2016-08-19T13:05:56.556Z', '2016-08-19T13:05:56.556Z', 60, 'us-east-1', 'abc', function (err, data) {
        assert.ifError(err);
        assert.deepEquals(data, datapoints, 'ok results for getMetricStatistics equal');
        assert.end();
    });
});

tape('[CloudWatch] restore', function (assert) {
    AWS.restore('CloudWatch');
    assert.end();
});
