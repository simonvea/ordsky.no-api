import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';

AWSSDK.config.logger = console;

const AWS = AWSXRay.captureAWS(AWSSDK);
const tableName = process.env.SESSION_TABLE!;

const docClient = new AWS.DynamoDB.DocumentClient();

export async function saveWordsAndConnectionId(
  words: string[],
  connectionId: string,
  tableId: string
) {
  const params = {
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
      ':id': docClient.createSet([connectionId]),
    },
    ReturnConsumedCapacity: 'TOTAL',
  };

  const result = await docClient.update(params).promise();

  return result.Attributes as {
    words: string[];
    numberOfEntries: number;
    connectionIds: { values: string[] };
  };
}
