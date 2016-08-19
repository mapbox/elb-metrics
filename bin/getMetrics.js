#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2));
var help = require('../util/help.js');
var startTime = argv.startTime;
var endTime = argv.endTime;
var period = argv.period;
var region = argv.region;
var elbname = argv.elbname;
var getMetrics = ('..');

if (!startTime || !endTime || !period || !region || !elbname) {
    help();
}

getMetrics(startTime, endTime, period, region, elbname, function (err, data) {
    if (err) throw Error;
    console.log(data);
});
