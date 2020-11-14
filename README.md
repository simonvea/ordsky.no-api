# ordsky-apiv2

This is the backend Websocket API for ordsky.no

## Deployment

In order to deploy write:

```bash
sam build
sam deploy
```

Changes to API gateway are not automatically deployed. One solution is to do the following

```bash
aws apigatewayv2 create-deployment --api-id ${id} --stage-name Prod --description "deployed from cli"
```
