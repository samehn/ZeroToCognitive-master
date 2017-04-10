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
var path = require('path');
var fs = require('fs');
var express = require('express');
var saml2 = require('saml2-js');
var Saml2js = require('saml2js') ;
var path = require('path');
var cookieParser = require('cookie-parser');
var env = require('../../env.json');
var sessionSecret = env.sessionSecret;

var myKey = path.join(path.dirname(require.main.filename),"cert","key.pem");
var myCert = path.join(path.dirname(require.main.filename),"cert","cert.pem");
var myKeyFile = fs.readFileSync(myKey);
var myCertFile = fs.readFileSync(myCert);

var serverURLb = "{your-route-name-goes-here}.w3ibm.mybluemix.net";
var serverURL = "http://" + serverURLb;
var serverURLs = "https://" + serverURLb;
var partnerIDURL = serverURLs+":443/metadata";
var entityURL = partnerIDURL + ".xml";
var loginpage = serverURL + "/login";
var app = express();
app.use(cookieParser(sessionSecret));

var loginURL = "https://w3id.alpha.sso.ibm.com/auth/sps/samlidp/saml20/logininitial?RequestBinding=HTTPPost&PartnerId="+partnerIDURL+"&NameIdFormat=email&Target="+serverURLs;

var sp_options = {
    entity_id: entityURL,
    private_key: myKeyFile.toString(),
    certificate: myCertFile.toString(),
    assert_endpoint: serverURLs + ":443/assert"
};
var sp = new saml2.ServiceProvider(sp_options);
var idp_options = {
sso_login_url: loginURL,
    certificates: fs.readFileSync("cert/w3id.sso.ibm.com").toString()
};
var idp = new saml2.IdentityProvider(idp_options);



// Endpoint to retrieve metadata
exports.metadata = function(req, res) {
  console.log("metadata entered");
  res.type('application/xml');
  res.send(sp.create_metadata());
}

// Starting point for login
exports.login = function(req, res) {
  //console.log(idp);
  console.log("login entered");
  sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null)
      return res.send(500);
    res.redirect(login_url);
  });
}

// Assert endpoint for when login completes
exports.assert = function(req, res) {
  console.log("assert entered");
  var options = {request_body: req };
  var response = new Buffer(req.body.SAMLResponse || req.body.SAMLRequest, 'base64');
  var parser = new Saml2js(response);
  var userFromW3 = parser.toObject();
  var email = userFromW3.emailaddress;
  console.log("assert completed for "+email);
  res.cookie('authenticated', email,{ maxAge: 43200, httpOnly: true, signed: true });
  res.cookie('email',email,{  maxAge: 43200 });
  res.status(302).redirect('/index.html');
}
