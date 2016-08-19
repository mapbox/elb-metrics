#!/usr/bin/env node
'use strict';

module.exports = {};
module.exports.getMetrics = getMetrics;

var AWS = module.exports.AWS = require('aws-sdk');

function getMetrics(startTime, endTime, period, region, elbname, callback) {
    AWS.config.update({region: region});
    var params = {

        EndTime: endTime,
        MetricName: 'Latency',
        Namespace: 'AWS/ELB',
        Period: period || 60,
        StartTime: endTime,
        Statistics: ['Sum', 'Average'],
        Dimensions: [
            {
                Name: 'LoadBalancerName',
                Value: elbname
            }
        ],
        Unit: 'Seconds'
    };

    var cloudwatch = new AWS.CloudWatch();
    cloudwatch.getMetricStatistics(params, function (err, data) {
        if (err) throw Error;
        else return callback(null, data);
    });
}
