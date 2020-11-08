'use strict';
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

const tableName = process.env.SESSION_TABLE;

exports.handler = async (event) => {
  const { action, id } = JSON.parse(event.body);
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

  const params = {
    TableName: tableName,
    Item: JSON.stringify({
      id,
    }),
  };

  try {
    await docClient.put(params).promise();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Failed to save id: ${e}`,
      }),
    };
  }

  return {
    statusCode: 200,
  };
};
