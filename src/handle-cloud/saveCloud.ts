'use strict';
import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';
const AWS = AWSXRay.captureAWS(AWSSDK);
const region = process.env.AWS_REGION as string;
const tableName = process.env.SESSION_TABLE as string;

const docClient = new AWS.DynamoDB.DocumentClient({ region });

export type WordCount = Array<{
  word: string;
  count: number;
}>;

export async function saveCloudToId(
  cloud: any,
  id: string,
  wordCount: WordCount = [{ word: '', count: 0 }]
) {
  const params = {
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
  };

  const result = await docClient.update(params).promise();

  return result;
}
