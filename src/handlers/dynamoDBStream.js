'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const { DOMAIN_NAME, STAGE } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: DOMAIN_NAME + '/' + STAGE,
});

// TODO: Figure out if it is best to send messages from this, or when it is entered. There might be concurrency issues in terms of messages to listeners if it is done directly?
exports.handler = async (event) => {
  console.info('Received:', event);
  const postCalls = event.Records.map((record) => {
    const { eventName } = record;
    // We only care about modified records
    if (eventName !== 'MODIFY') return;
    console.info('Handling record', record);
    const oldImage = AWS.DynamoDB.Converter.unmarshall(
      record.dynamodb.OldImage
    );
    const newImage = AWS.DynamoDB.Converter.unmarshall(
      record.dynamodb.NewImage
    );

    const id = record.dynamodb.NewImage.id; // string
    const connectionIds = record.dynamodb.NewImage.connectionIds; // String set

    if (!oldImage.cloud && newImage.cloud) {
      // Send cloud
      const cloud = newImage.cloud;
      console.info('sending cloud to connectionIds', cloud);

      return connectionIds.map(async (connectionId) => {
        try {
          await apigwManagementApi
            .postToConnection({
              ConnectionId: connectionId,
              Data: JSON.stringify({ cloud }),
            })
            .promise();
        } catch (e) {
          if (e.statusCode === 410) {
            console.info('Found stale connection, but dont care');
            // We don't care about a stale connection in this case, as the session is finnished.
          } else {
            throw e;
          }
        }
      });
    }
    // We only want to update if there is a difference in words or cloud.
    if (oldImage.numberOfEntries !== newImage.numberOfEntries) {
      // Notify about numberOfEntries
      const numberOfEntries = newImage.numberOfEntries;

      console.info(
        'Sending number of entries to connectionIds',
        numberOfEntries
      );
      return connectionIds.map(async (connectionId) => {
        try {
          await apigwManagementApi
            .postToConnection({
              ConnectionId: connectionId,
              Data: JSON.stringify({ numberOfEntries }),
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
