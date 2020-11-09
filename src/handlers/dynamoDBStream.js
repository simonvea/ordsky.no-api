'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const { DOMAIN_NAME, STAGE } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: DOMAIN_NAME + '/' + STAGE,
});

exports.handler = async (event) => {
  const postCalls = event.Records.map((record) => {
    const { eventName } = record;
    // We only care about modified records
    if (eventName !== 'MODIFY') return;
    const oldImage = record.dynamodb.OldImage;
    const newImage = record.dynamodb.NewImage;

    const { connectionIds, id } = record.dynamodb.NewImage;

    if (!oldImage.cloud && newImage.cloud) {
      // Send cloud
      const cloud = newImage.cloud;

      return connectionIds.map(async (connectionId) => {
        try {
          await apigwManagementApi
            .postToConnection({ ConnectionId: connectionId, Data: { cloud } })
            .promise();
        } catch (e) {
          if (e.statusCode === 410) {
            // We don't care about a stale connection in this case, as the session is finnished.
          } else {
            throw e;
          }
        }
      });
    }
    // We only want to update if there is a difference in words or cloud.
    // TODO: Does words get prefaces with type?
    if (
      newImage.numberOfEntries &&
      oldImage.numberOfEntries !== newImage.numberOfEntries
    ) {
      // Notify about numberOfEntries
      const numberOfEntries = newImage.numberOfEntries;

      return connectionIds.map(async (connectionId) => {
        try {
          await apigwManagementApi
            .postToConnection({
              ConnectionId: connectionId,
              Data: { numberOfEntries },
            })
            .promise();
        } catch (e) {
          if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            //Remove the stale connectionId
            await docClient
              .update({
                TableName: TABLE_NAME,
                Key: { id },
                UpdateExpression: 'DELETE connectionIds :id',
                ExpressionAttributeValues: { ':id': connectionId },
                ReturnValues: 'NONE',
              }) //DELETE requires that it is a set (which it is:D)
              .promise();
          } else {
            throw e;
          }
        }
      });
    }
  });

  try {
    await Promise.all(postCalls.flat());
  } catch (e) {
    console.error(e);
  }
};
