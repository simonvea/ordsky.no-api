'use strict';
import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';
const AWS = AWSXRay.captureAWS(AWSSDK);
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.SESSION_TABLE as string;

export async function saveCloudToId(cloud: any, id: string) {
  const params = {
    TableName: tableName,
    Key: {
      id: id,
    },
    UpdateExpression: 'SET cloud = :cloud, #exp = #exp + :exp',
    ExpressionAttributeNames: {
      '#exp': 'expdate',
    },
    ExpressionAttributeValues: {
      ':cloud': cloud,
      ':exp': 60 * 60 * 24 * 365, // Adds one year to expiry date TODO: Do this here or when fetching data?
    },
    ReturnConsumedCapacity: 'TOTAL',
  };

  const result = await docClient.update(params).promise();

  return result;
}
