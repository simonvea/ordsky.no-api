'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.SESSION_TABLE;

exports.handler = async (event) => {
  console.info('received:', event);

  const { action, id } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;
  if (action !== 'startsession') {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Tried handling the wrong action: ${action}. I'm supposed to handle: startsession`,
      }),
    };
  }
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing id!',
      }),
    };
  }

  // Initializing all attributes so that we can do a SET updateExpression later
  const params = {
    TableName: tableName,
    Item: {
      id: id.toString(),
      numberOfEntries: 0,
      words: [],
      connectionIds: docClient.createSet([connectionId]),
    },
  };

  try {
    await docClient.put(params).promise();
    console.info('successfully saved id and connectionId');
  } catch (e) {
    console.error('failed to save ids:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Failed to save id: ${e}`,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `successfully started session with id ${id}`,
    }),
  };
};
