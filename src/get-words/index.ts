'use strict';
import AWSXRay from 'aws-xray-sdk';
import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

const docClient = DynamoDBDocumentClient.from(dynamodb);

const tableName = process.env.SESSION_TABLE as string;

export const handler = async (event: APIGatewayEvent) => {
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
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      id,
    },
    AttributesToGet: ['words'],
    ConsistentRead: true, // We want to be sure all words are there
    ReturnConsumedCapacity: 'TOTAL',
  });

  return await docClient.send(command);
}
