'use strict';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.SESSION_TABLE;

exports.handler = async function (event, context) {
  const promises = event.Records.map(async (record) => {
    const { body } = record;
    console.log(body);

    const { cloud, id } = JSON.parse(body);

    const params = {
      TableName: tableName,
      Key: {
        id: id.toString(),
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

    try {
      const result = await docClient.update(params).promise();
      console.info(
        'Successfully updated database with cloud, consumed write capacity:',
        result.ConsumedCapacity
      );
    } catch (e) {
      console.error('Failed to update db with cloud:', e);

      throw e; // This puts the item back in queue
    }
  });

  await Promise.all(promises); // NB! If one record fails, all records are put back in queue.
  return {};
};
