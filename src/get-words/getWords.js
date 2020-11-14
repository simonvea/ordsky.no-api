'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.SESSION_TABLE;

exports.handler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id } = JSON.parse(event.body);

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing id!',
      }),
    };
  }

  let data;
  try {
    data = await docClient
      .get({
        TableName: tableName,
        Key: {
          id,
        },
        AttributesToGet: ['words'],
        ConsistentRead: true, // We want to be sure all words are there
        ReturnConsumedCapacity: 'TOTAL',
      })
      .promise();

    console.info('Successfully retrieved words', data);
  } catch (e) {
    console.error('Failed to retrieve item from db', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to retrieve data from database',
      }),
    };
  }

  const { words } = data.Item;

  return {
    statusCode: 200,
    body: JSON.stringify({
      type: 'GET_WORDS',
      words,
    }),
  };
};
