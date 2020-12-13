import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';

AWSSDK.config.logger = console;

const AWS = AWSXRay.captureAWS(AWSSDK);
const tableName = process.env.SESSION_TABLE!;
const endpoint = process.env.ENDPOINT;

const docClient = new AWS.DynamoDB.DocumentClient();
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint,
});

export async function removeConnectionId(connectionId: string, key: string) {
  return docClient
    .update({
      TableName: tableName,
      Key: { id: key },
      UpdateExpression: 'DELETE connectionIds :id', //DELETE requires that it is a set (which it is:D)
      ExpressionAttributeValues: {
        ':id': docClient.createSet([connectionId]),
      },
      ReturnValues: 'NONE',
    })
    .promise();
}

export async function getConnections(id: string): Promise<string[]> {
  const params = {
    TableName: tableName,
    Key: {
      id,
    },
    AttributesToGet: ['connectionIds'],
    ReturnConsumedCapacity: 'TOTAL',
  };

  const result = await docClient.get(params).promise();

  console.info(
    'Successfully retrieved connectionIds, consumed capacity:',
    result.ConsumedCapacity
  );

  const { connectionIds } = result.Item as {
    connectionIds: { values: string[] };
  };

  // Connection IDs is a dynamoDB Set, we want the values..
  return connectionIds.values;
}

type SaveToConnectionsArg = {
  message: Record<string, any>;
  connections: string[];
  onStaleConnection?: (staleConnection: string) => Promise<void>;
};

// TODO: Get endpoint from env?
export async function sendToConnections({
  message,
  connections,
  onStaleConnection = (staleConnection: string) => Promise.resolve(),
}: SaveToConnectionsArg) {
  const messages = connections.map(async (connectionId) => {
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(message),
        })
        .promise();
      console.info('posted to ', connectionId);
    } catch (e) {
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
