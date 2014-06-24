#!/usr/bin/env node
var request = require('request');
var colors = require('colors');
var npmview = require('npmview');
var exec = require('sync-exec');

var opts = require('nomnom')
  .option('author', {
    abbr: 'a',
    default: 'npm whoami',
    help: 'The author to show the tests from'
  })
  .option('registry', {
    abbr: 'r',
    default: 'http://registry.npmjs.org',
    help: 'The npm registry to use'
  })
  .parse()
  ;
  
  // Default to npm whoami
  if(opts.author !== 'npm whoami') {
    var author = opts.author
  } else {
    var author = exec('npm whoami').stdout.trim();
  }
    
  var url = opts.registry + '/-/by-user/' + author;
  console.log('Requesting modules by ' + author + ' ...');
  request({url: url, json: true}, function (err, response, body) {
    if(err) { console.error(err); return; }
    if(response.statusCode !== 200) { 
      console.error('Registry Error ' + response.statusCode);
      return;
    }
    var packages = body[author];
    var doneAll = function (test, total) {
      var percentage = Math.round(test / total * 100);
      console.log(percentage + "% of modules have tests. (" + test + "/" + total + ")");
    }
    var testCount = 0;
    var totalCount = 0;
    packages.forEach(function (pack) {
      npmview(pack, function (err, version, info) {
        if(err) { console.error(err); return; }
      
        var hasTest = info.scripts && info.scripts.test && info.scripts.test != 'echo "Error: no test specified" && exit 1';
        if (hasTest) testCount++;
        totalCount++;
        var moduleStatus = hasTest ? '\u2713'.green : '\u2717'.red;

        console.log('-' + info.name + ' ' + moduleStatus);

        if (totalCount == packages.length) {
            doneAll(testCount, totalCount);
        }
      });
    });
  });