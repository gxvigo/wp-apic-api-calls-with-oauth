# APIC security services
===================

This repository hosts a Node.js Express application used to implement custom pages and authentication 
routes for OAuth flow in APIC.
The Node.js provides and to end flow for OAuth (confidential - access code). Start with /OAuthTest route.

Environment and application details are defined in paramaters.json file

## Resources

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
https://github.com/gxvigo/apic-oauthTutorial-apis

## Documentation
- OAuth2 api defintion: ./doc/APIC_OAuth2_api_definition.jpg
- Flow diagrams: ./doc/Flow_diagrams.pdf



## Portal on my Mac
-  app: Fintech
  -  clientID: e220c8a4-0eba-4a8f-9657-50b982f5f47a
  -  secret: fD0sI1sW3mM4nO8gN6dN3cO5eF2lD5tB1yT1jB8oJ1mU1wK1uV
  -  OAuth redirect URL: http://192.168.225.1:3080/clientOAuthRedirectionURL


## API OAuth initial request - on my Mac
https://api.think.ibm/sales/sb/oauth-end/oauth2/authorize?response_type=code&redirect_uri=http://192.168.225.1:3080/clientOAuthRedirectionURL&scope=view_branches&client_id=ab9b3671-bfb0-4d08-b954-f00693a69c75
