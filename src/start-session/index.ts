import AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

import { APIGatewayEvent } from 'aws-lambda';

const dynamoDB = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

const docClient = DynamoDBDocumentClient.from(dynamoDB);

const tableName = process.env.SESSION_TABLE as string;

export const handler = async (event: APIGatewayEvent) => {
  console.info('received:', event);

  const { id } = JSON.parse(event.body as string);
  const { connectionId } = event.requestContext;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing id!',
      }),
    };
  }

  // Initializing all attributes so that we can do a SET updateExpression later
  const command = new PutCommand({
    TableName: tableName,
    Item: {
      id: id.toString(),
      numberOfEntries: 0,
      words: [],
      connectionIds: new Set(connectionId as string),
      expdate: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 2), // Expires in two hours
    },
    ReturnConsumedCapacity: 'TOTAL',
  });

  try {
    await docClient.send(command);
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
