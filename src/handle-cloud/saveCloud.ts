'use strict';
import AWSXRay from 'aws-xray-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamodb = AWSXRay.captureAWSv3Client(
  new DynamoDBClient({ logger: console })
);

const docClient = DynamoDBDocumentClient.from(dynamodb);

const tableName = process.env.SESSION_TABLE as string;

export type WordCount = Array<{
  text: string;
  count: number;
}>;

export async function saveCloudToId(
  cloud: any,
  id: string,
  wordCount: WordCount = [{ text: '', count: 0 }]
) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      id: id,
    },
    UpdateExpression:
      'SET cloud = :cloud, #exp = #exp + :exp, wordCount = :words',
    ExpressionAttributeNames: {
      '#exp': 'expdate',
    },
    ExpressionAttributeValues: {
      ':cloud': cloud,
      ':words': wordCount,
      ':exp': 60 * 60 * 24 * 365, // Adds one year to expiry date TODO: Do this here or when fetching data?
    },
    ReturnConsumedCapacity: 'TOTAL',
  });

  const result = await docClient.send(command);

  return result;
}
