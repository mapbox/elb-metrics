#!/usr/bin/env node
'use strict';
var argv = require('minimist')(process.argv.slice(2));
var help = require('../util/help.js');
var startTime = new Date(argv.startTime);
var endTime = new Date(argv.endTime);
var region = argv.region;
var elbname = argv.elbname;
var metrics = require('../index');

if (!startTime || !endTime || !region || !elbname) {
    help();
}

var allMetrics = metrics.prepareQueries(startTime, endTime, region, elbname);
console.log(allMetrics);

