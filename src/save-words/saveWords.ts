import AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

const docClient = DynamoDBDocumentClient.from(dynamodb);

const tableName = process.env.SESSION_TABLE!;

export async function saveWordsAndConnectionId(
  words: string[],
  connectionId: string,
  tableId: string
) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      id: tableId,
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
      ':id': new Set([connectionId]),
    },
    ReturnConsumedCapacity: 'TOTAL',
  });

  const result = await docClient.send(command);

  console.info(
    'Updated table with words. Consumed capacity:',
    result.ConsumedCapacity
  );

  return result.Attributes as {
    words: string[];
    numberOfEntries: number;
    connectionIds: Set<string>;
  };
}
