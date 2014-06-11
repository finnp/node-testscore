#!/usr/bin/env node
var request = require('request');
var colors = require('colors');
var exec = require('sync-exec');

var opts = require('nomnom')
  .option('author', {
    abbr: 'a',
    default: 'npm whoami',
    help: 'The author to show the tests from'
  })
  .parse()
  ;
  
  // Default to npm whoami
  if(opts.author !== 'npm whoami') {
    var author = opts.author
  } else {
    var author = exec('npm whoami').stdout.trim();
  }
    
  var nWithTests = 0;
  var url = 'http://registry.npmjs.org/-/by-user/' + author;
  console.log('Requesting modules by ' + author + ' ...');
  request({url: url, json: true}, function (err, response, body) {
    var packages = body[author];
    packages.forEach(function (pack) {
      process.stdout.write('- ' + pack);
      checkTestField(pack);
    });
    console.log(nWithTests + '/' + packages.length + ' modules have tests');
  });
  
  function checkTestField(pack) {
    var testcommand =  exec('npm view ' + pack +' scripts.test --silent').stdout.trim();
    if(testcommand && testcommand != 'echo "Error: no test specified" && exit 1') {
      process.stdout.write(' \u2713'.green);
      nWithTests++;
    } else {
      process.stdout.write(' \u2717'.red);
    }
    console.log();
  }

  

