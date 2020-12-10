import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';
const AWS = AWSXRay.captureAWS(AWSSDK);

const tableName = process.env.SESSION_TABLE as string;
const region = process.env.AWS_REGION as string;

const docClient = new AWS.DynamoDB.DocumentClient({ region });

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
  const params = {
    TableName: tableName,
    Item: {
      id: id.toString(),
      numberOfEntries: 0,
      words: [],
      connectionIds: docClient.createSet([connectionId as string]),
      expdate: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 2), // Expires in two hours
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
