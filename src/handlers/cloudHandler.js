const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

const tableName = process.env.SAMPLE_TABLE;

/**
 * Updates table with cloud.
 */
exports.cloudHandler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, cloud } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (!id || !cloud || !connectionId) {
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
      cloud: {
        Action: 'PUT',
        Value: cloud,
      },
    },
  };

  await docClient.update(params).promise();

  const response = {
    statusCode: 201,
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${connectionId} statusCode: ${response.statusCode}`
  );
  return response;
};
