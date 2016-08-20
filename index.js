'use strict';

module.exports = {};
module.exports.getMetrics = getMetrics;
module.exports.prepareQueries = prepareQueries;
module.exports.outputMetrics = outputMetrics;
var queue = require('d3-queue').queue;
var AWS = module.exports.AWS = require('aws-sdk');

function prepareQueries(startTime, endTime, region, elbname) {
    var desiredMetrics = {'HTTPCode_Backend_2XX': 'SampleCount', 'HTTPCode_Backend_3XX': 'SampleCount', 'HTTPCode_Backend_4XX': 'SampleCount', 'HTTPCode_Backend_5XX': 'SampleCount', 'RequestCount': 'SampleCount','Latency': 'Average',};
    var desiredMetricsParameters = [];

    for (var i in desiredMetrics) {

        var params = {
            EndTime: new Date(endTime).toISOString(),
            MetricName: i,
            Namespace: 'AWS/ELB',
            Period: 60,
            StartTime: new Date(startTime).toISOString(),
            Statistics: [desiredMetrics[i].toString()],
            Dimensions: [
                {
                    Name: 'LoadBalancerName',
                    Value: elbname
                }
            ]
        };
        desiredMetricsParameters.push({parameter: params, region: region});
    }
    return desiredMetricsParameters;
}

function outputMetrics(desiredMetricsDimensions, region, callback) {
    var q = queue(6);

    desiredMetricsDimensions.forEach(function (i) {
        q.defer(getMetrics, i.parameter, i.region);
    });
    q.awaitAll(callback);
}

function getMetrics(params, region, callback) {
    var allDatapoints = [];
    AWS.config.update({region: region});
    var cloudwatch = new AWS.CloudWatch();

    cloudwatch.getMetricStatistics(params, function (err, data) {
        if (err) return callback(err);
        else {
            allDatapoints.push(data);
            return callback(null, allDatapoints);
        }
    });
}

