var express = require('express');
var config = require('./config')
var app = express();
app.use(express.static(__dirname + '/build'));
app.listen(config.PORT);
module.exports = app;