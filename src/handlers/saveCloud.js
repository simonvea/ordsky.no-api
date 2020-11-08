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
  const { connectionId } = event.requestContext;

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

  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  const params = {
    TableName: tableName,
    Key: {
      id: id.toString(),
    },
    ReturnValues: 'UPDATED_NEW',
    AttributeUpdates: {
      cloud: {
        Action: 'PUT',
        Value: cloud,
      },
    },
  };

  try {
    await docClient.update(params).promise();
    console.info('Successfully updated database with cloud');
    return {
      statusCode: 200,
    };
  } catch (e) {
    console.error('Failed to update db with cloud:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to update db with cloud.',
      }),
    };
  }
};
