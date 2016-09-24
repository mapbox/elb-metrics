'use strict';
var metrics = require('../index');
var tape = require('tape');
var AWS = require('aws-sdk');
var prepareQueries = metrics.prepareQueries;
var outputMetrics = metrics.outputMetrics;
var elbMetrics = metrics.elbMetrics;
var prepareResults = metrics.prepareResults;
var metricdatapoint = require('./fixture/datapoints.json');
var parameters = require('./fixture/prepareQueries_fixtures.json');
var originalCloudWatch = AWS.CloudWatch;

tape('validate if it is an AWS region', function (assert) {
    elbMetrics(1471610000000, 1471614276790, 'xyz', 'abc', function (err, data) {
        assert.equal(err.message, 'provided region name not an AWS region', 'ok validated region name');
        assert.end();
    });
});

tape('validate if ELB name is a string', function (assert) {
    elbMetrics(1471610000000, 1471614276790, 'us-east-1', 1234, function (err, data) {
        assert.equal(err.message, 'provided ELB name should be a string', 'ok ELB type');
        assert.end();
    });
});

tape('validate if start time is greater than end time', function (assert) {
    elbMetrics(1471614276790, 1471610000000, 'us-east-1', 'abc', function (err, data) {
        assert.equal(err.message, 'EndTime should be greater than startTime', 'ok end/start time error');
        assert.end();
    });
});


tape('validate if start and end time are no more than 60 minutes apart', function (assert) {
    elbMetrics(1471692377978, 1471698014705, 'us-east-1', 'abc', function (err, data) {
        assert.equal(err.message, 'start and end time should not be more than 60 minutes apart', 'ok end/start time error');
        assert.end();
    });
});

tape('prepare queries', function (assert) {
    var obj = {
        startTime: 1471610000000,
        endTime: 1471614276790,
        region: 'us-east-1',
        elbname: 'abc'
    };
    var datapoints = prepareQueries(obj);
    assert.deepEquals(datapoints, parameters, 'ok desired metrics parameters equal');
    assert.end();
});

tape('mocking [CloudWatch]', function (assert) {

    AWS.CloudWatch = MockCloudWatch;
    function MockCloudWatch() {}

    MockCloudWatch.prototype.getMetricStatistics = function (params, callback) {
        metricdatapoint.forEach(function (i) {
            if (params.MetricName === i.Label) callback(null, i);
        });
    };
    assert.end();
});

tape('ELB metrics', function (assert) {
    var obj = {
        startTime: 1473838245009,
        endTime: 1473838232083,
        region: 'us-east-1',
        elbname: 'abc'
    };
    var datapoints = prepareQueries(obj);
    var expectedPecentages = {period: '12s',
    requestPerSecond: '4/s',
    percent2xx: '50 %',
    percent3xx: '25 %',
    percent4xx: '22.92 %',
    percent5xx: '2.08 %',
    avgLatency: 0.3};

    outputMetrics(datapoints, datapoints[0].region, function (err, data) {
        assert.ifError(err);
        assert.deepEquals(data, metricdatapoint, 'ok results for getMetricStatistics equal');
        var requestPercentages = prepareResults(obj.startTime, obj.endTime, data);
        assert.deepEquals(requestPercentages, expectedPecentages, 'okay metric percentages equal');
        assert.end();
    });
});


tape('[CloudWatch] restore', function (assert) {
    AWS.CloudWatch = originalCloudWatch;
    assert.end();
});
