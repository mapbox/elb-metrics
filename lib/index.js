var metrics = module.exports = {};
var AWS = module.exports.AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

metrics.getMetrics = function (params, callback) {
    var cloudwatch = new AWS.CloudWatch();
    cloudwatch.getMetricStatistics(params, function (err, data) {
        if (err) throw Error;
        else callback(null, data);
    });
};
