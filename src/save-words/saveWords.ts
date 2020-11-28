import AWSXRay from 'aws-xray-sdk';
import AWSSDK from 'aws-sdk';
const AWS = AWSXRay.captureAWS(AWSSDK);
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-north-1' });

const tableName = process.env.SESSION_TABLE!;

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
  };

  const result = await docClient.update(params).promise();
  console.info('Updated db, response:', result);

  return result.Attributes as {
    words: string[];
    numberOfEntries: number;
    connectionIds: { values: string[] };
  };
}
