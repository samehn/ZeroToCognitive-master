/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * Zero to Cognitive Chapter 7-2
 */

var fs = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var path = require('path');
var mime = require('mime');
var http = require('http');

var https = require('https');
var myKey = path.join(path.dirname(require.main.filename),"cert","key.pem");
var myCert = path.join(path.dirname(require.main.filename),"cert","cert.pem");
var myKeyFile = fs.readFileSync(myKey);
var myCertFile = fs.readFileSync(myCert);
var env = require('./controller/env.json');
var sessionSecret = env.sessionSecret;

// start of security
var serverURLb = "z2c-chapter7-sso.w3ibm.mybluemix.net";
var serverURL = "http://" + serverURLb;
var serverURLs = "https://" + serverURLb;
var partnerIDURL = serverURLs+":443/metadata";
var entityURL = partnerIDURL + ".xml";
var loginpage = serverURLs + "/login";

// create a new express server
var app = express();
app.use(cookieParser(sessionSecret));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('appName', 'z2c-chapter7-sso');
app.set('port', appEnv.port);

// app.use(function(req, res, next){console.log("server requested for: "+req.url); next();});
app.get('/js*', function(req, res) {
  if ((typeof(req.signedCookies.authenticated) != 'undefined') &&
  (req.signedCookies.authenticated == req.cookies.email )) {loadSelectedFile(req, res);}
  else {res.redirect(loginpage);}
});
app.get('/in*', function(req, res) {
  if ((typeof(req.signedCookies.authenticated) != 'undefined') &&
  (req.signedCookies.authenticated == req.cookies.email )) {loadSelectedFile(req, res);}
  else {res.redirect(loginpage);}
});
app.get('/', function(req, res) { res.redirect(loginpage); });
app.use('/', require("./controller/restapi/router"));
app.use(express.static(__dirname + '/HTML'));

var appEnv = cfenv.getAppEnv();

if (cfenv.getAppEnv().isLocal == true)
{
  console.log("Starting with local profile.");
  var pkey = myKeyFile;
  var pcert = myCertFile;
  var httpsOptions = { key: pkey, cert: pcert, 'max-age': 0 };
  // max-age values: 0 = expire immediately, 3600= 1 hour, 43200 = 12 hours, 86400=24 hours
}

console.log("starting server");
// start server on the specified port and binding host
if (cfenv.getAppEnv().isLocal == true)
  {
    https.createServer(httpsOptions, app).listen(app.get('port'),
        function(req, res) {console.log(app.get('appName')+' is listening locally on port: ' + app.get('port'));});
  }
  else
  {
    var server = app.listen(app.get('port'), function() {console.log('Listening on port %d', server.address().port);});
  }

function displayObjectValues (_string, _object)
  {
    for (prop in _object){
        console.log(_string+prop+": "+(((typeof(_object[prop]) == 'object') || (typeof(_object[prop]) == 'function'))  ? typeof(_object[prop]) : _object[prop]));}
}
function loadSelectedFile(req, res) {
    var uri = req.originalUrl;
    var filename = __dirname + "/HTML" + uri;
    fs.readFile(filename,
        function(err, data) {
            if (err) {
                res.writeHead(500);
                console.log('Error loading ' + filename + ' error: ' + err);
                return res.end('Error loading ' + filename);
            }
            res.setHeader('content-type', mime.lookup(filename));
            res.writeHead(200);
            res.end(data);
        });
}
