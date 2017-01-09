# APIC security services
===================

This repository hosts a Node.js Express application used to implement custom pages and authentication 
routes for OAuth flow in APIC.
The Node.js provides and to end flow for OAuth (confidential - access code). Start with /OAuthTest route.

Environment and application details are defined in paramaters.json file

## Resources

  - /index.html : Entry page to make a call to 'Branches details' API
  - 
  - /login.html : custom login form
  - 
  - /authenticate : authentication URL (always return 200 unless 'wrong' user is passed)
  - 
  - /identityExtraction : check credentials passed by login.html and call back APIM with 'username' and 'confimation' (code) 
  - 
  - /authenticateUser : used for APIC OAuth login redirect
  - 
  - /clientOAuthRedirectionURL : OAuth Redirection URL (from Portal), called by apic OAuth passig OAuth code and with this requesting OAuth access_token
  -
  - /OAuthTest: initiate OAuth flow (code has hardcoded, APIC OAuth links, clientId, secret, App OAuth redirection URL)
  -
  - /soapClient: API client to invoke a SOAP endpoint. (GET)


# This project works with APIs from the repo below:
https://github.com/gxvigo/wp-apic-api-definitions-with-oauth

## Documentation
- OAuth2 api defintion: ./doc/APIC_OAuth2_api_definition.jpg
- Flow diagrams: ./doc/Flow_diagrams.pdf



## Portal on my Mac
-  app: wp-Fintech
  -  clientID: e220c8a4-0eba-4a8f-9657-50b982f5f47a
  -  secret: fD0sI1sW3mM4nO8gN6dN3cO5eF2lD5tB1yT1jB8oJ1mU1wK1uV
  -  OAuth redirect URL: http://192.168.225.1:3080/clientOAuthRedirectionURL


## API call with OAuth flow (on my Mac)

0. Check:
  -  that the clientId in the URL below is correct
  -  that the parameters in the parameters.json file are correct

1. From a browser open the link below:
https://api.think.ibm/sales/sb/oauth-end/oauth2/authorize?response_type=code&redirect_uri=http://192.168.225.1:3080/clientOAuthRedirectionURL&scope=view_branches&client_id=e220c8a4-0eba-4a8f-9657-50b982f5f47a

### what happens:
  -  the call hits APIC GW (OAuth provider); because the Idendity Extraction has been defined as 'Redirect', the request is 
     redirected to login.html (resource part of this project)

2. Insert user name and password and submit (Log in)

### what happens:
  -  the login.html sends (action) the form to the service 'identityExtraction' (end point provided by this application).
  -  the identityExtraction service, check the user and create a confirmation code (for security) and makes a callback to 
     APIC GW (from HTTP Referer Header) passing user name and confirmation code
  -  APIC GW calls the authentication service 'authenticateUser' (end point provided by this application), where the user name 
     and the confirmation code are validated. If valid a HTTP return code 200 is sent back to APIC GW
     In this sample authenticatUser inject OAuth metadata in the token as well (API-OAUTH-METADATA-FOR-ACCESSTOKEN)
  -  API GW perform the Authorization step. At the time of this update, there's a bug in the product for which if Authorization 
     is set to 'Default Form', OAuth metadata are not passed, so Authorization is set to Authenticated.

3. If Authorization is set Default Form, user has to allow the app to access his Resources. If set to Authenticated, the resource  
   access is granted automatically

4. 

