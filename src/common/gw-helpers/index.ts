import AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

const dynamoDB = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

const docClient = DynamoDBDocumentClient.from(dynamoDB);

const tableName = process.env.SESSION_TABLE!;
const endpoint = process.env.ENDPOINT;

const apigwManagementApi = new ApiGatewayManagementApiClient({
  apiVersion: '2018-11-29',
  endpoint,
});

export async function removeConnectionId(connectionId: string, key: string) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: key },
    UpdateExpression: 'DELETE connectionIds :id', //DELETE requires that it is a set (which it is:D)
    ExpressionAttributeValues: {
      ':id': new Set([connectionId]),
    },
    ReturnValues: 'NONE',
  });

  return docClient.send(command);
}

export async function getConnections(id: string): Promise<string[]> {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      id,
    },
    AttributesToGet: ['connectionIds'],
    ReturnConsumedCapacity: 'TOTAL',
  });

  const result = await docClient.send(command);

  console.info(
    'Successfully retrieved connectionIds, consumed capacity:',
    result.ConsumedCapacity
  );

  const { connectionIds } = result.Item as {
    connectionIds: Set<string>;
  };

  // Connection IDs is a Set, we want the values..
  return Array.from(connectionIds);
}

type SaveToConnectionsArg = {
  message: Record<string, any>;
  connections: string[];
  onStaleConnection?: (staleConnection: string) => Promise<void>;
};

export async function sendToConnections({
  message,
  connections,
  onStaleConnection = (staleConnection: string) => Promise.resolve(),
}: SaveToConnectionsArg) {
  const messages = connections.map(async (connectionId) => {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(message) as unknown as Uint8Array, // bypass type check, string is valid according to docs
    });

    try {
      await apigwManagementApi.send(command);
      console.info('posted to ', connectionId);
    } catch (e: any & { statusCode: number }) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection.`);
        await onStaleConnection(connectionId);
      } else {
        throw e;
      }
    }
  });

  return Promise.all(messages);
}
