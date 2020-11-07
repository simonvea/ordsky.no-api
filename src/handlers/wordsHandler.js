const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

const tableName = process.env.SAMPLE_TABLE;

/**
 * Updates table with words.
 */
exports.wordsHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, words } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (!id || !words || !connectionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id, words and a connectionId',
      }),
    };
  }

  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  const params = {
    TableName: tableName,
    Key: {
      id,
    },
    ReturnValues: 'UPDATED_NEW',
    AttributeUpdates: {
      words: {
        Actions: 'ADD',
        Value: words,
      },
      numberOfEntries: {
        Actions: 'ADD',
        Value: 1,
      },
      connectionIds: {
        Actions: 'ADD',
        Value: [connectionId], // Having it as an array ensures that it is treated as a set?
      },
    },
  };

  const result = await docClient.update(params).promise();

  const { numberOfEntries } = result.Attributes;

  const response = {
    statusCode: 200,
    body: JSON.stringify({ numberOfEntries }),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
