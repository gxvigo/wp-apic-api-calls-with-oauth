var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var open = require('open');
var soap = require('soap');
var appParameters = require('./parameters.json');  // apic platform and application parameters

var app = express();
var router = express.Router();  // get instance for express Router

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // to solve DEPTH_ZERO_SELF_SIGNED_CERT error in CallbackToAPIC

var API_GW_URL = `https://${appParameters.apicDataPowerGatewayHostname}/${appParameters.apicProviderOrganization}/${appParameters.apicCatalog}`;


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());

app.set('port', process.env.PORT || 3080);  // set listening PORT

app.use(express.static(__dirname + '/public')); // configure web server content static directory 


/***********************************
*           define routes
************************************/

// 1. This route is used for authentication service (authenticatio URL)
router.get('/authenticate', function (req, res) {

    console.log('### /authenticate - route called');
    if (req.headers.authorization) {
        var autorizationHeader = req.headers.authorization
        // console.log('autorizationHeader' + autorizationHeader);

        var token = autorizationHeader.split(/\s+/).pop() || '';
        var auth = new Buffer(token, 'base64').toString();
        var parts = auth.split(/:/);
        var username = parts[0];
        var password = parts[1];

        console.log('### /authenticate - User: ' + username + ' , password: ' + password);

        // Replace code below to properly handle user authentication
        if (username === 'wrong') {
            res.status(401).send({ message: 'Authentication failure, pass a user different than \"wrong\"' });
        } else {
            res.status(200).send({ message: 'Authentication success, pass user \"wrong\" to have a failure' });
        };
    } else {
        console.log('### /authenticate - Authorization header missing');
        res.status(500).send({ message: 'Authentication failure, authorization header missing' });

    }

})

// 2. This route is used for Identity Extraction and callback APIC appending username and confirmation code
router.post('/identityExtraction', function (req, res) {

    console.log('### /identityExtraction - route called');
    console.log('### /identityExtraction - refererAsIs: ' + req.headers.referer);   

    var refererDecoded = decodeURIComponent(req.headers.referer);

    // All logic to authenticate and authorize stage here. Below just simple hard coded sample
    console.log('### /identityExtraction - req.body.username: ' + req.body.username);
    var usernameConfirmation = '&username=' + req.body.username + '&confirmation=1234'; 

    // next 2 line with referer decoded
    var n = refererDecoded.indexOf("?");
    var CallbackToAPIC = refererDecoded.substring(n + 14) + usernameConfirmation


    console.log('### /identityExtraction - CallbackToAPIC: ' + CallbackToAPIC);

    request(CallbackToAPIC, function (error, response, body) {
        console.log('### /identityExtraction - CallbackToAPIC callback');
        console.log('### /identityExtraction - CallbackToAPIC response.statusCode: ' + response.statusCode);
        if (!error && response.statusCode == 200) {
            console.log('### /identityExtraction - CallbackToAPIC Success');
            // console.log('### /identityExtraction - CallbackToAPIC Success - body: ' + body); // Show the HTML form from APIC in case of Authorization Default Form.
            res.send(body); // Send the response of this api call back to the /identityExtraction caller (login.html)
        } else { 
            console.log('### /identityExtraction - CallbackToAPIC Failure');
            console.log('### /identityExtraction - CallbackToAPIC Failure error: ' + error); // Show the HTML for the Modulus homepage.
            res.send('### /identityExtraction - CallbackToAPIC Success - body: ' + body); // Send the response of this api call back to the /identityExtraction caller (login.html)
        } 
    });
})

// 3. This route is used for authentication purpose
router.get('/authenticateUser', function (req, res) {

    console.log('### /authenticateUser - route called');
    if (req.headers.authorization) {
        var autorizationHeader = req.headers.authorization
        console.log('### /authenticateUser - autorizationHeader' + autorizationHeader);

        var token = autorizationHeader.split(/\s+/).pop() || '';
        var auth = new Buffer(token, 'base64').toString();
        var parts = auth.split(/:/);
        var username = parts[0]; 
        var confirmation = parts[1];

        // here code to validate username and code

        console.log('### /authenticateUser - User: ' + username + ' , confirmation: ' + confirmation);

        // setting header for OAuth metadata test
        res.setHeader('API-OAUTH-METADATA-FOR-ACCESSTOKEN', '{"mobileNo":"TradeMe","SelectedAccount":"0305020339928000"}');

        console.log('### /authenticateUser - HTTP 200 sent');
        res.status(200).send('OK'); // Always validate the user and code
    } 
})

// 4. This route is used to handle OAuth flow (token) from an App perspective (Dev. Portal)
router.get('/clientOAuthRedirectionURL', function (req, res) {

    console.log('### /clientOAuthRedirectionURL - route called');
    var reqURL = req.url;  // api invoke this route passing OAuth code, code extraction below
    // console.log('### /clientOAuthRedirectionURL - reqURL: ' + req.url); // Print out the URL of the request
    var oauthCode = reqURL.substring(reqURL.indexOf('?code') + 6);  // OAuth code to be used to request OAuth token
    console.log('### /clientOAuthRedirectionURL - oauthCode: ' + oauthCode);


    // Request OAuth token using OAuth code received 
    var form = {
        grant_type: 'authorization_code',
        redirect_uri: 'http://192.168.225.1:3080/clientOAuthRedirectionURL',
        code: oauthCode
    };
    var formData = querystring.stringify(form);
    var contentLength = formData.length;

    var clientIdEncoded = new Buffer(appParameters.clientID).toString('base64');
    var secretEncoded = new Buffer(':' + appParameters.secret).toString('base64');
    var authorizationHeaderEncoded = 'Basic ' + clientIdEncoded + secretEncoded;
    // console.log('### /clientOAuthRedirectionURL -  authorizationHeaderEncoded base64: ' + authorizationHeaderEncoded);

    var tokenReqOptions = {
        headers: {
            'Authorization': authorizationHeaderEncoded,
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
            },
        uri: API_GW_URL + '/oauth-end/oauth2/token',
        body: formData,
        method: 'POST'
    };
    request(tokenReqOptions, function (tokenErr, tokenRes, tokenBody) {
        if (tokenErr){ 
            console.log('### /clientOAuthRedirectionURL - OAuth token request failed, err: ' + tokenErr);
        } else {
            // console.log('### /clientOAuthRedirectionURL - OAuth token request success, tokenBody: ' + tokenBody);
            /*
            Example response tokenBody:
            { "token_type":"bearer", "access_token":"AAEkYWI5YjM2NzEtYmZiMC00ZDA4LWI5NTQtZjAwNjkzYTY5Yzc1gxewf3AA2axCbRecHj6IMdG0KYivSBsS7TSUqsbHujpOG6fNmiHx6fUViVuVjVaGq0E7-WVyuaKe1TorDWDvyw", "expires_in":3600, "scope":"view_branches" }
            */
            var oauthTokenObj = JSON.parse(tokenBody);
            console.log('### /clientOAuthRedirectionURL - OAuth token_type: ' + oauthTokenObj.token_type);
            console.log('### /clientOAuthRedirectionURL - OAuth access_token: ' + oauthTokenObj.access_token);

            // API resource (end point) call - start
            var apiCalliOptions = { method: 'GET',
                            url: API_GW_URL + '/branches-cac/details',
                            headers: 
                                { accept: 'application/json',
                                    'content-type': 'application/json',
                                    'X-IBM-Client-Id': appParameters.clientID, 
                                    // 'authorization': oauthTokenObj.token_type + ' ' +  oauthTokenObj.access_token} 
                                    'Authorization': 'Bearer'+ ' ' +  oauthTokenObj.access_token}
                            };
            console.log('### /clientOAuthRedirectionURL - apiCalliOptions: ' +  JSON.stringify(apiCalliOptions));

            request(apiCalliOptions, function (apiCallErr, apiCallResponse, ApiCallBody) {
                if (apiCallErr) return console.error('Failed: %s', apiCallErr.message);

                console.log('### /clientOAuthRedirectionURL - API Call Success: ' + ApiCallBody);
                //send back response to index.html
                res.setHeader('content-type', 'application/json');
                res.send(ApiCallBody);
            });

            // API resource (end point) call - start

        }
    });

    // res.status(200).send({ message: 'Operaction completed' });
})


// 5. This route is used to start OAuth flow (token) from an App perspective (Dev. Portal)
router.get('/OAuthTest', function (req, res) {

    console.log('### /OAuthTest - route called');
    open(`https://${appParameters.apicDataPowerGatewayHostname}/${appParameters.apicProviderOrganization}/${appParameters.apicCatalog}${appParameters.oauthApiProviderAuthorizationPath}?response_type=${appParameters.oauthResponseType}&redirect_uri=${appParameters.appOauthRedirectionURL}&scope=${appParameters.oauthScope}&client_id=${appParameters.clientID}`, function (err) {
        if (err) throw err;
            console.log('The user closed the browser');
    });  // open the link in the computer default browsers
    res.status(200).send({ message: 'Login page opened in another window'});
})


// 6. API call - SOAP
// var soap = require('soap');
router.get('/soapClient', function (req, res) {

    var url = "http://www.restfulwebservices.net/wcf/StockQuoteService.svc?wsdl";
    var args = { "tns:request": "IBM" };
    var options = {
        endpoint: API_GW_URL + "/StockQuoteService",
    };

    soap.createClient(url, options, function (err, client) {
        client.addHttpHeader('x-ibm-client-id', "e220c8a4-0eba-4a8f-9657-50b982f5f47a");
        // console.log('### client: ' + JSON.stringify(client.StockQuoteService.BasicHttpBinding_IStockQuoteService));
        client.StockQuoteService.BasicHttpBinding_IStockQuoteService.GetStockQuote(args, function (err, result) {
            if (err) {
                // throw err; 
                console.log(err);
            } else {
                SOAPRequestCallback(result);
                console.log(result);
            }  
        });
    });  

    function SOAPRequestCallback(soapResponse){
        res.status(200).send({ message: 'SOAP call complete, response: ' + JSON.stringify(soapResponse)});
    }
});



//register routes
app.use('/', router);

var server = app.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'));
    console.log('Resource: /authenticate : authentication URL, always return 200 unless username \"wrong\" is used in basic authentication');
});

/* automatically open /index.html in Chrome (it fails on Windows or if Chrome is installed in
 *  in a different path. Delete , '/Applications/Google\ Chrome.app' to use default browser)
 * */
open('http://localhost:3080/index.html', '/Applications/Google\ Chrome.app', function (err) {
  if (err) throw err;
  console.log('The user closed the browser');
});