"use strict";

var gulp = require("gulp");
var phantomas = require("phantomas");
var tableify = require("tableify");
var fs = require("fs");
var async = require("async");
var YSlow = require("yslowjs");
var ngrok = require("ngrok");
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var config = require('./config');
var psi = require("psi");
var simplehar = require("simplehar");
var del = require("del");
var fs = require("fs");
var server = require("./server");
var pm2 = require('pm2');

//var proxy = "http://10.144.1.10:8080";
//var url = "http://9d5caf3.ngrok.com/traffica-insights.html#!/";
//var url = "http://localhost:3000/traffica-insights.html#!/";
var url = "http://ramanathanmuthuraman.github.io/React-Duck2Go/";
var perfomanceSourceFiles = "./public/source/";
var perfomanceResults = "./build/";


var perfomanceDataFilePath = perfomanceResults + "perfomanceData.json";
var pages = [{
	title: "React-DuckDuckGo",
	url: "",
	selector: "body"
}];

gulp.task("copy", function() {

	if (!fs.existsSync(perfomanceResults)) {
		fs.mkdirSync(perfomanceResults);
	}

	gulp.src(perfomanceSourceFiles + "**")
		.pipe(gulp.dest(perfomanceResults));
});
gulp.task("phantomas", function(cb) {
	var metrics = [];
	var config = {
		reporter: "json"
	};


	
	async.eachSeries(pages, function(page, callback) {

	return	phantomas(url + page.url, {
			"screenshot": perfomanceResults + page.title + ".jpg",
			"wait-for-selector": page.selector,
			"timeout": 100,
			"har": perfomanceResults + page.title + ".har",
			//"proxy":proxy,
			"reporter": config.reporter
		}, function(err, json) {

			if(err){
				console.log(err);
				return;
			}
			//fs.writeFile(perfomanceResults + "test.json", JSON.stringify(json));
			simplehar({
				har: perfomanceResults + page.title + ".har",
				html: perfomanceResults + page.title + ".html"
			});

			metrics.push({
				"title": page.title,
				"stats" : [{
					"title":"DOM Content loaded",
					"time":json.metrics.domInteractive+json.metrics.domComplete,
					"units" : "ms",
					"info":""
				},{
					"title":"DOM elements count",
					"time":json.metrics.DOMelementsCount,
					"units" : "elements",
					"info":""
				},{
					"title":"Time To First CSS",
					"time":json.metrics.timeToFirstCss,
					"units" : "ms",
					"info":json.offenders.timeToFirstCss
				},{
					"title":"Time To First JS",
					"time":json.metrics.timeToFirstJs,
					"units" : "ms",
					"info":json.offenders.timeToFirstJs
				},{
					"title":"Smallest Response",
					"time":json.metrics.smallestResponse,
					"units" : "bytes",
					"info":json.offenders.smallestResponse
				},{
					"title":"Biggest Response",
					"time":json.metrics.biggestResponse,
					"units" : "bytes",
					"info":json.offenders.biggestResponse
				},{
					"title":"Fastest Response",
					"time":json.metrics.fastestResponse,
					"units" : "ms",
					"info":json.offenders.fastestResponse
				},{
					"title":"Slowest Response",
					"time":json.metrics.slowestResponse,
					"units" : "ms",
					"info":json.offenders.slowestResponse
				},{
					"title":"Smallest Latency",
					"time":json.metrics.smallestLatency,
					"units" : "ms",
					"info":json.offenders.smallestLatency
				},{
					"title":"Biggest Latency",
					"time":json.metrics.biggestLatency,
					"units" : "ms",
					"info":json.offenders.biggestLatency
				},{
					"title":"Time Backend",
					"time":json.metrics.timeBackend,
					"units" : "%",
					"info": ""
				},{
					"title":"Time Frontend",
					"time":json.metrics.timeFrontend,
					"units" : "%",
					"info":""
				},{
					"title":"Caching Disabled",
					"time":json.metrics.cachingDisabled,
					"units" : "files",
					"info": json.offenders.cachingDisabled
				},{
					"title":"Assets Not Gzipped",
					"time":json.metrics.assetsNotGzipped,
					"units" : "files",
					"info":json.offenders.assetsNotGzipped
				}],
				"fileType": [{
					"title": "CSS",
					"value": json.metrics.cssSize,
					"files": json.offenders.cssCount
				}, {
					"title": "JS",
					"value": json.metrics.jsSize,
					"files": json.offenders.jsCount
				}, {
					"title": "Images",
					"value": json.metrics.imageSize,
					"files": json.offenders.imageCount
				}, {
					"title": "Fonts",
					"value": json.metrics.webfontSize,
					"files": json.offenders.webfontCount
				}, {
					"title": "Others",
					"value": json.metrics.otherSize,
					"files": json.offenders.otherCount
				}]
			});
			callback(null, json);
		});
	}, function() {
		
		gulp.start("copy");
		fs.writeFileSync(perfomanceDataFilePath, "");
		fs.appendFileSync(perfomanceDataFilePath, JSON.stringify(metrics));
		cb(null);
		

	});
});

gulp.task("yslow", function() {
	var yslowResultFilePath = perfomanceResults + "/yslow.html";
	fs.writeFileSync(yslowResultFilePath);
	async.eachSeries(pages, function(page, callback) {
		var yslow = new YSlow(url + page.url, ["--info", "grade"]);
		yslow.run(function(err, data) {
			if(err){
				console.log(err);
				return;
			}
			fs.appendFileSync(yslowResultFilePath, decodeURIComponent(tableify(data)));
			callback(null, data);
		});
	});
});

gulp.task("psi", function() {
	var googlePageSpeedInsightsResultFilePath = perfomanceResults + "/psi.html";
	fs.writeFileSync(googlePageSpeedInsightsResultFilePath);
	ngrok.connect(3000, function(err, ngrokurl) {
		if(err){
				console.log(err);
				return;
			}
		async.eachSeries(pages, function(page, callback) {
			psi(ngrokurl + "/traffica-insights.html#!/" + page.url, {
				nokey: "true",
				strategy: "desktop",
			}, function(err, data) {
				if(err){
				console.log(err);
					return;
				}
				fs.appendFileSync(googlePageSpeedInsightsResultFilePath, tableify(data));
				callback(null, data);
			});
		}, function() {
			ngrok.disconnect();
		});
	});
});
gulp.task("clean", function() {
	del(perfomanceResults + "**/*");
});

gulp.task("reload", function() {
	gulp.src(perfomanceResults + "*")
		.pipe(reload({
			stream: true
		}));
});

gulp.task("watch", function() {
	gulp.watch([perfomanceSourceFiles + "*"], ["copy", "reload"]);
});


gulp.task('browser-sync', function() {

	browserSync({
		proxy: config.HOSTNAME + ":" + config.PORT,
		files: [perfomanceResults + '/*'],
		// server:perfomanceResults,
		ghostMode: false
	});

});

gulp.task('pm2', function() {
	pm2.connect(function() {
		pm2.start("server.js", "server");
	});
});

gulp.task("dev",  ["phantomas"],  function(cb) {
	cb(startServer("browser-sync"));
	gulp.start('watch');
});
gulp.task("build", ["phantomas"], function(cb) {
	cb(startServer("pm2"));
});
function startServer(type){
	gulp.start(type);
}
gulp.task("default", ["dev"]);