'use strict';

module.exports = {};
module.exports.getMetrics = getMetrics;

var AWS = module.exports.AWS = require('aws-sdk');

function getMetrics(period, region, elbname, callback) {
    AWS.config.update({region: region});
    var params = {

        EndTime: new Date().toISOString(),
        MetricName: 'Latency',
        Namespace: 'AWS/ELB',
        Period: period || 60,
        StartTime: new Date(new Date() - 24 * 60 * 60).toISOString(),
        Statistics: ['Sum', 'Average'],
        Dimensions: [
            {
                Name: 'LoadBalancerName',
                Value: elbname
            }
        ],
        Unit: 'Seconds'
    };
    console.log(params);
    var cloudwatch = new AWS.CloudWatch();
    cloudwatch.getMetricStatistics(params, function (err, data) {
        if (err) return callback(err);
        else return callback(null, data);
    });
}
