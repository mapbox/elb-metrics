var metrics = require('../lib/index');
var tape = require('tape');
var AWS = require('aws-sdk-mock');
var getMetrics = metrics.getMetrics;
var today = new  Date();
var yesterday = new Date(new Date() - 24 * 60 * 60);
var datapoints = require('./fixture/cloudwatch_datapoints.json');

tape('mocking [ELB]', function (assert) {
    AWS.mock('CloudWatch', 'getMetricStatistics', function (params, callback) {
        var expected = {
            EndTime: today.toISOString(),
            MetricName: 'Latency',
            Namespace: 'AWS/ELB',
            Period: 60,
            StartTime: yesterday.toISOString(),
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
    var params = {
        EndTime: today.toISOString(),
        MetricName: 'Latency',
        Namespace: 'AWS/ELB',
        Period: 60,
        StartTime: yesterday.toISOString(),
        Statistics: ['Sum', 'Average'],
        Dimensions: [
            {
                Name: 'LoadBalancerName',
                Value: 'abc'
            }
        ],
        Unit: 'Seconds'
    };
    getMetrics(params, function (err, data) {
        assert.ifError(err);
        assert.deepEquals(data, datapoints, 'ok results for getMetricStatistics equal');
        assert.end();
    });
});

tape('[metrics] restore', function (assert) {
    AWS.restore('CloudWatch');
    assert.end();
});
