'use strict';
var metrics = require('../index');
var tape = require('tape');
var AWS = require('aws-sdk-mock');
var prepareQueries = metrics.prepareQueries;
var outputMetrics = metrics.outputMetrics;
var elbMetrics = metrics.elbMetrics;
var metricdatapoint = require('./fixture/datapoints.json');
var parameters = require('./fixture/prepareQueries_fixtures.json');

tape('validate if it is an AWS region', function (assert) {
    elbMetrics(1471610000000, 1471614276790, 'xyz', 'abc', function (err, data) {
        assert.equal(err.message, 'provided region name not an AWS region', 'ok validated region name');
        assert.end();
    });
});

tape('validate if it is an AWS region', function (assert) {
    elbMetrics(1471610000000, 1471614276790, 'us-east-1', 1234, function (err, data) {
        assert.equal(err.message, 'provided ELB name should be a string', 'ok ELB type');
        assert.end();
    });
});

tape('prepare queries -- region', function (assert) {
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

tape('mocking [ELB]', function (assert) {
    AWS.mock('CloudWatch', 'getMetricStatistics', function (params, callback) {

        metricdatapoint.forEach(function (i) {
            if (params.MetricName === i.Label)
                callback(null, i);
        });
    });
    assert.end();
});
tape('ELB metrics', function (assert) {
    var obj = {
        startTime: 1471692377978,
        endTime: 1471698014705,
        region: 'us-east-1',
        elbname: 'api-geocoder-production'
    };
    var datapoints = prepareQueries(obj);

    outputMetrics(datapoints, datapoints[0].region, function (err, data) {
        if (err) console.log(err);
        assert.ifError(err);
        assert.deepEquals(data, metricdatapoint, 'ok results for getMetricStatistics equal');
        assert.end();
    });
});

tape('[CloudWatch] restore', function (assert) {
    AWS.restore('CloudWatch');
    assert.end();
});
