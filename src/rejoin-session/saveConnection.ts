import AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.SESSION_TABLE!;

const dynamoDB = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

export async function saveConnectionId(connectionId: string, tableId: string) {
  const command = new UpdateItemCommand({
    TableName: tableName,
    Key: { id: { S: tableId } },
    ReturnValues: 'UPDATED_NEW',
    UpdateExpression: 'ADD connectionIds :id',
    ExpressionAttributeValues: {
      ':id': { SS: [connectionId] },
    },
    ReturnConsumedCapacity: 'TOTAL',
  });
  const result = await dynamoDB.send(command);

  console.info(
    'Added new connectionId. Consumed capacity:',
    result.ConsumedCapacity
  );

  return result.Attributes;
}
