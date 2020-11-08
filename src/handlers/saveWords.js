const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

const tableName = process.env.SESSION_TABLE;

/**
 * Updates table with words.
 */
exports.handler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, words, action } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (action !== 'savewords') {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Tried handling the wrong action: ${action}. I'm supposed to handle: savewords`,
      }),
    };
  }

  if (!id || !words) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and words.',
      }),
    };
  }

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
    `response from: ${action} statusCode: ${response.statusCode} body: ${response.body}`
  );
  return response;
};
