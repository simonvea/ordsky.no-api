'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.SESSION_TABLE;

/**
 * Updates table with cloud.
 */
exports.handler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, cloud, action } = JSON.parse(event.body);
  const { domainName, stage } = event.requestContext;

  if (action !== 'savecloud') {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Tried handling the wrong action: ${action}. I'm supposed to handle: savecloud`,
      }),
    };
  }

  if (!id || !cloud) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and cloud',
      }),
    };
  }

  const params = {
    TableName: tableName,
    Key: {
      id: id.toString(),
    },
    ReturnValues: 'ALL_OLD', // Don't need to return saved cloud as it is already here, but we need all conenctionIds
    UpdateExpression: 'SET cloud = :cloud',
    ExpressionAttributeValues: {
      ':cloud': cloud,
    },
    ReturnConsumedCapacity: 'TOTAL',
  };

  let result;
  try {
    result = await docClient.update(params).promise();
    console.info(
      'Successfully updated database with cloud, consumed write capacity:',
      result.ConsumedCapacity
    );
  } catch (e) {
    console.error('Failed to update db with cloud:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to update db with cloud.',
      }),
    };
  }

  // We want to do this here instead of in streams in order to be more syncronous
  // However, this might mean that some listeners will receive the wrong number of entries due to concurrency issues?
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: domainName.includes('ordsky') // Custom domain names already includes stage
      ? `https://${domainName}`
      : `https://${domainName}/${stage}`,
  });

  const { connectionIds } = result.Attributes;

  const message = {
    type: 'CLOUD_CREATED',
    cloud,
  };

  const messages = connectionIds.values.map(async (connectionId) => {
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(message),
        })
        .promise();
      console.info('posted to ', connectionId);
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        //Remove the stale connectionId
        await docClient
          .update({
            TableName: tableName,
            Key: { id },
            UpdateExpression: 'DELETE connectionIds :id', //DELETE requires that it is a set (which it is:D)
            ExpressionAttributeValues: {
              ':id': docClient.createSet([connectionId]),
            },
            ReturnValues: 'NONE',
          })
          .promise();
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(messages);

    console.info(`Successfully sendt cloud to connections: ${cloud}`);
  } catch (e) {
    console.error('Failed to send cloud to connections', e);
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) }; // TODO: Should response be included?
};
