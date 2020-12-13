'use strict';
import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';

AWSSDK.config.logger = console;

const AWS = AWSXRay.captureAWS(AWSSDK);
const tableName = process.env.SESSION_TABLE as string;

const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event: APIGatewayEvent) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id } = JSON.parse(event.body!);

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
    data = await getWords(id);
  } catch (e) {
    console.error('Failed to retrieve item from db', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to retrieve data from database',
      }),
    };
  }

  const { words } = data.Item as { words: string[] };

  return {
    statusCode: 200,
    body: JSON.stringify({
      type: 'GET_WORDS',
      words,
    }),
  };
};

async function getWords(id: string) {
  return await docClient
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
}
