'use strict';

module.exports = {};
module.exports.getMetrics = getMetrics;
module.exports.prepareQueries = prepareQueries;
module.exports.outputMetrics = outputMetrics;
module.exports.elbMetrics = elbMetrics;
module.exports.prepareResults = prepareResults;
module.exports.preFlightCheck = preFlightCheck;
var queue = require('d3-queue').queue;
var AWS = module.exports.AWS = require('aws-sdk');

/**
 * Creates parameters for each cloudwatch query given the input from the user.
 * @param {Object} following input from the user - startTime, endTime, region, elbname
 * @param {callback}
 */

function elbMetrics(startTime, endTime, region, elbname, callback) {
    var diffInMinutes;
    var awsRegions = ['us-east-1', 'us-west-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'eu-central-1', 'eu-west-1'];

    if (!(awsRegions.indexOf(region) >= 0)) {
        return callback(new Error('provided region name not an AWS region'));
    }

    if (typeof elbname != 'string') {
        return callback(new Error('provided ELB name should be a string'));
    }

    if ((startTime - endTime) > 0) {
        return callback(new Error('EndTime should be greater than startTime'));
    }

    diffInMinutes = Math.round((endTime - startTime) / 60000);
    if (diffInMinutes > 60) {
        return callback(new Error('start and end time should not be more than 60 minutes apart'));
    }

    preFlightCheck(elbname, function (err, name) {
        var elb = 0;
        if (err) return callback(err);
        if (name.indexOf('app/') === -1) { elb = 1; }
        var parameters = {
            startTime: startTime,
            endTime: endTime,
            region: region,
            elbname: name
        };
        var queries = prepareQueries(parameters, elb);
        outputMetrics(queries, region, function (err, data) {
            if (err) return callback(err);
            var requestPercentages = prepareResults(startTime, endTime, data);
            return callback(null, requestPercentages);
        });
    });
}

function preFlightCheck(elbname, callback) {
    var q = queue(6);
    q.defer(getELBName, elbname);
    q.defer(getALBName, elbname);
    q.awaitAll(function (err, data) {
        if (err) console.log('err', err);
        data = data.filter(d => { return d; });
        return callback(null, data[0]);

    });
}

function getALBName(elbname, callback) {
    var elbv2 = new AWS.ELBv2();
    var parameter = {Names: [elbname]};
    elbv2.describeLoadBalancers(parameter, function (err, data) {
        if (err) {
            if (err.code === 'LoadBalancerNotFound') return callback(null, null);
        } else {
            var arn = data.LoadBalancers[0].LoadBalancerArn;
            var albName = arn.match(/app.*/);
            return callback(null, albName[0]);
        }
    });
}

function getELBName(elbname, callback) {
    var elb = new AWS.ELB();
    var parameter = {LoadBalancerNames: [elbname]};
    elb.describeLoadBalancers(parameter, function (err, data) {
        if (err) {
            if (err.code === 'LoadBalancerNotFound') return callback(null, null);
        }
        return callback(null, data.LoadBalancerDescriptions[0].LoadBalancerName);
    });
}

/**
 * Creates parameters for each cloudwatch query given the input from the user.
 * @param {Object} commmand line input formatted into an object
 * @returns {Array} array of desired metric parameters
 */

function prepareQueries(obj, elb) {
    var desiredMetricsParameters = [];
    if (elb) {
        var desiredELBMetrics = {
            'HTTPCode_Backend_2XX': 'Sum',
            'HTTPCode_Backend_3XX': 'Sum',
            'HTTPCode_Backend_4XX': 'Sum',
            'HTTPCode_Backend_5XX': 'Sum',
            'RequestCount': 'Sum',
            'Latency': 'Average'
        };

        for (var i in desiredELBMetrics) {

            var params = {
                EndTime: new Date(obj.endTime).toISOString(),
                MetricName: i,
                Namespace: 'AWS/ELB',
                Period: 60,
                StartTime: new Date(obj.startTime).toISOString(),
                Statistics: [desiredELBMetrics[i].toString()],
                Dimensions: [
                    {
                        Name: 'LoadBalancerName',
                        Value: obj.elbname
                    }
                ]
            };
            desiredMetricsParameters.push({parameter: params, region: obj.region});
        }
    } else {
        var desiredALBMetrics = {
            'HTTPCode_Target_2XX_Count': 'Sum',
            'HTTPCode_Target_3XX_Count': 'Sum',
            'HTTPCode_Target_4XX_Count': 'Sum',
            'HTTPCode_Target_5XX_Count': 'Sum',
            'RequestCount': 'Sum',
            'TargetResponseTime': 'Average'
        };

        for (var j in desiredALBMetrics) {
            var parameters = {
                EndTime: new Date(obj.endTime).toISOString(),
                MetricName: j,
                Namespace: 'AWS/ApplicationELB',
                Period: 60,
                StartTime: new Date(obj.startTime).toISOString(),
                Statistics: [desiredALBMetrics[j].toString()],
                Dimensions: [
                    {
                        Name: 'LoadBalancer',
                        Value: obj.elbname
                    }
                ]
            };
            desiredMetricsParameters.push({parameter: parameters, region: obj.region});
        }
    }
    return desiredMetricsParameters;
}

/**
 * Queues requests for each parameter and returns a formatted version of the result
 *
 * @param {Array} parameters generated by prepareQueries
 * @param {String} region where the ELB is present
 * @param {callback}
 * @returns {Array} formatted results received from cloudwatch getMetricStatistics
 */

function outputMetrics(desiredMetricsDimensions, region, callback) {
    var q = queue(6);
    var allMetrics = [];
    desiredMetricsDimensions.forEach(function (i) {
        q.defer(getMetrics, i.parameter, i.region);
    });
    q.awaitAll(function (err, data) {
        if (err) return callback(err);
        data.forEach(function (i) {
            allMetrics.push({Label: i.Label, Datapoints: i.Datapoints});
        });
        return callback(null, allMetrics);
    });
}


/** Makes requests to the cloudwatch api and gets Sum/Average for
 * HTTPCode_Backend_2XX, HTTPCode_Backend_3XX, HTTPCode_Backend_4XX, HTTPCode_Backend_5XX, RequestCount, Latency
 *
 * @param {Object} parameter Object for getMetricStatistics
 * @param {String} region where the ELB is present
 * @param {callback}
 * @returns {Object} Datapoints and Labels for the given MetricName in the form of an Object
*/

function getMetrics(params, region, callback) {
    AWS.config.update({region: region});
    var cloudwatch = new AWS.CloudWatch();

    cloudwatch.getMetricStatistics(params, callback);
}

function prepareResults(startTime, endTime, data) {
    var diff = startTime - endTime;
    var period = Math.abs(Math.floor(diff / 1000));
    var total = [];
    var sumLatency = 0;

    for (var i = 0; i < data.length - 1; i++) {
        total[i] = totalRequests(data[i]);
    }
    /* calculate percentage of 2xx, 3xx, 4xx, 5xx */

    var requestPerSecond = Math.round((total[4] / period) * 100) / 100;
    var percent2xx = Math.round(((total[0] / total[4]) * 100) * 100) / 100;
    var percent3xx = Math.round(((total[1] / total[4]) * 100) * 100) / 100;
    var percent4xx = Math.round(((total[2] / total[4]) * 100) * 100) / 100;
    var percent5xx = Math.round(((total[3] / total[4]) * 100) * 100) / 100;

    /* average latency */
    data[5].Datapoints.forEach(function (i) {
        sumLatency += i.Average;
    });
    var avgLatency = Math.round((sumLatency / data[5].Datapoints.length) * 100) / 100;

    return {
        'period': period + 's',
        'requestPerSecond': requestPerSecond + '/s',
        'percent2xx': percent2xx + ' %',
        'percent3xx': percent3xx + ' %',
        'percent4xx': percent4xx + ' %',
        'percent5xx': percent5xx + ' %',
        'avgLatency': avgLatency
    };
}

function totalRequests(metric) {
    var sum = 0;
    metric.Datapoints.forEach(function (i) {
        sum += i.Sum;
    });
    return sum;
}
