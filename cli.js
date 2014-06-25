#!/usr/bin/env node
var request = require('request');
var chalk = require('chalk');
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
    
  function doneAll(test, total) {
    var percentage = Math.round(test / total * 100);
    console.log(chalk.yellow(quality(test, total)) + 
      chalk.grey(" " + percentage + "% of modules have tests (" + test + "/" + total + ")"));
    console.log("testscore: " + testscore(test, total));
  }
  
  function testscore(test, total) {
    // test count two times
    return 3 * test - total;
  }
  
  function quality(test, total) {
    var filled = '\u2605 ';
    var empty = '\u2606 ';
    var totalStars = 7;
    var stars = Math.round(test/total * 7);
    var emptyStars = totalStars - stars;
    return Array(stars + 1).join(filled) + Array(emptyStars + 1).join(empty);
  }
    
  var url = opts.registry + '/-/by-user/' + author;
  console.log(chalk.grey('Requesting modules by ' + author + ' ...'));
  request({url: url, json: true}, function (err, response, body) {
    if(err) { console.error(err); return; }
    if(response.statusCode !== 200) { 
      console.error('Registry Error ' + response.statusCode);
      return;
    }
    var packages = body[author];
    var testCount = 0;
    var totalCount = 0;
    packages.forEach(function (pack) {
      npmview(pack, function (err, version, info) {
        if(err) { console.error(err); return; }
      
        var hasTest = info.scripts && info.scripts.test && 
          info.scripts.test != 'echo "Error: no test specified" && exit 1';
        if (hasTest) testCount++;
        totalCount++;
        var moduleStatus = hasTest ? chalk.green('\u2713') : chalk.red('\u2717');

        console.log(chalk.grey(info.name)  + ' ' + moduleStatus);

        if (totalCount == packages.length) {
            doneAll(testCount, totalCount);
        }
      });
    });
  });