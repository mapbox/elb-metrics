'use strict';
function help() {
    console.log('\n Fetches Elastic Load Balancer Metrics. \n');
    console.log(' --startTime --endTime --period --region --elbname arguements are required\n');
    console.log('[options]:');
    console.log('  --startTime=Timestamp from when you want the metrics to be calculated. (e.g., 1471610000000 )');
    console.log('  --endTime=Timestamp till when metrics need to be calculated.(e.g., 1471614276790)');
    console.log('  --period=The granularity, in seconds, of the returned datapoints.');
    console.log('  --region=The region to send service requests to');
    console.log('  --elbname=Name of the Elastic Load Balancer');
    console.log('  --help  Print this report\n');
    process.exit(0);
}
module.exports = help;
