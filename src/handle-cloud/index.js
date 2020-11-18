'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const sqsUrl = process.env.SQS_URL;
const tableName = process.env.SESSION_TABLE;

/**
 * Updates table with cloud.
 */
exports.handler = async (event) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, cloud } = JSON.parse(event.body);
  const { domainName, stage } = event.requestContext;

  if (!id || !cloud) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and cloud',
      }),
    };
  }

  const params = {
    TableName: tableName,
    Key: {
      id,
    },
    AttributesToGet: ['connectionIds'],
    ReturnConsumedCapacity: 'TOTAL',
  };

  let result;
  try {
    result = await docClient.get(params).promise();
    console.info(
      'Successfully retrieved connectionIds, consumed capacity:',
      result.ConsumedCapacity
    );
  } catch (e) {
    console.error('Failed to get connectionIds:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to update db with cloud.',
      }),
    };
  }

  // We want to do this here instead of in streams in order to be more syncronous
  // However, this might mean that some listeners will receive the wrong number of entries due to concurrency issues?
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: domainName.includes('ordsky') // Custom domain names already includes stage
      ? `https://${domainName}`
      : `https://${domainName}/${stage}`,
  });

  const { connectionIds } = result.Item;

  const message = {
    type: 'CLOUD_CREATED',
    cloud,
  };

  const messages = connectionIds.values.map(async (connectionId) => {
    try {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify(message),
        })
        .promise();
      console.info('posted to ', connectionId);
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection.`);
        //Remove the stale connectionId
        console.log(
          "This is last step, so I don't care about stale connections."
        );
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(messages);

    console.info(`Successfully sendt cloud to connections: ${cloud}`);
  } catch (e) {
    console.error('Failed to send cloud to connections', e);
  }

  const sqsParams = {
    MessageBody: JSON.stringify({ cloud, id }),
    QueueUrl: sqsUrl,
  };
  try {
    await sqs.sendMessage(sqsParams).promise();
    console.info('successfully sent cloud to queue');
  } catch (e) {
    console.error('Failed to send message to queue', e);
  }

  return { statusCode: 200, body: JSON.stringify(message) }; // TODO: Should response be included?
};
