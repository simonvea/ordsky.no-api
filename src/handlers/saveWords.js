'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.SESSION_TABLE;

/**
 * Updates table with words.
 */
exports.handler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, words, action } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (action !== 'savewords') {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Tried handling the wrong action: ${action}. I'm supposed to handle: savewords`,
      }),
    };
  }

  if (!id || !words) {
    console.info('The request was missing id or words');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and words.',
      }),
    };
  }

  const params = {
    TableName: tableName,
    Key: {
      id: id.toString(),
    },
    ReturnValues: 'UPDATED_NEW',
    UpdateExpression:
      'SET #words = list_append(#words, :vals), #ne = #ne + :ne ADD connectionIds :id',
    ExpressionAttributeNames: {
      '#words': 'words',
      '#ne': 'numberOfEntries',
    },
    ExpressionAttributeValues: {
      ':vals': words,
      ':ne': 1,
      ':id': docClient.createSet([connectionId]),
    },
  };

  try {
    const result = await docClient.update(params).promise();
    console.info('Updated db, response:', result);

    const { numberOfEntries } = result.Attributes;
    const response = {
      statusCode: 201,
      body: JSON.stringify({ numberOfEntries }),
    };
    console.info(`response from: ${action} responded: ${response}`);
    return response;
  } catch (e) {
    console.error('Failed to save to db. Error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to save words.',
      }),
    };
  }
};
