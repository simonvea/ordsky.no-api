'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.SESSION_TABLE;

// TODO: Must be implement in template, or fetched from request...
const { DOMAIN_NAME, STAGE } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: DOMAIN_NAME + '/' + STAGE,
});

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
    console.info('The request was missing id or words');
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
      id: id.toString(),
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

  let result;
  try {
    result = await docClient.update(params).promise();
    console.info('Updated db, response:', result);
  } catch (e) {
    console.error('Failed to save to db. Error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to save words.',
      }),
    };
  }

  try {
    const { numberOfEntries, connectionIds } = result.Attributes;

    await postToConnectionIds(id, connectionIds.values, {
      type: 'WORDS_ADDED',
      numberOfEntries,
    });

    console.info(
      `Successfully sendt number of entries to connections: ${numberOfEntries}`
    );
  } catch (e) {
    console.error('Failed to send number of entries to connections', e);
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) }; // TODO: Should response be included?
};

// We want to do this here instead of in streams in order to be more syncronous
// However, this might mean that some listeners will receive the wrong number of entries due to concurrency issues?
async function postToConnectionIds(itemId, connectionIds, data) {
  const promises = connectionIds.map(async (connectionId) => {
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(data),
        })
        .promise();
      console.info('posted to ', connectionId);
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        //Remove the stale connectionId
        await docClient
          .update({
            TableName: tableName,
            Key: { id: itemId },
            UpdateExpression: 'DELETE connectionIds :id', //DELETE requires that it is a set (which it is:D)
            ExpressionAttributeValues: {
              ':id': docClient.createSet([connectionId]),
            },
            ReturnValues: 'NONE',
          })
          .promise();
      } else {
        throw e;
      }
    }
  });
  return Promise.all(promises);
}
