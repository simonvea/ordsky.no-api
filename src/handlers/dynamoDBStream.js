const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// https://github.com/aws-samples/simple-websockets-chat-app/blob/master/template.yaml

// TODO: Ensure these are available
const { DOMAIN_NAME, STAGE } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint:
    // event.requestContext.domainName + '/' + event.requestContext.stage,
    DOMAIN_NAME + '/' + STAGE,
});

exports.handler = async (event) => {
  let postCalls = [];

  event.Records.foreach((record) => {
    const oldImage = record.dynamodb.OldImage;
    const newImage = record.dynamodb.NewImage;

    const { connectionIds } = record.dynamodb.NewImage;

    const data = {
      connectionIds,
      numberOfEntries: undefined,
      cloud: undefined,
    };

    // We only want to update if there is a difference in words or cloud.
    // TODO: Does words get prefaces with type?
    if (
      newImage.numberOfEntries &&
      oldImage.numberOfEntries !== newImage.numberOfEntries
    ) {
      // Notify about numberOfEntries
      data.numberOfEntries = newImage.numberOfEntries;
    }

    if (!oldImage.cloud && newImage.cloud) {
      // Send cloud
      data.cloud = newImage.cloud;
    }
    postCalls.push(
      connectionIds.map(async ({ connectionId }) => {
        try {
          await apigwManagementApi
            .postToConnection({ ConnectionId: connectionId, Data: data })
            .promise();
        } catch (e) {
          if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            // Remove the stale connectionId
            // await docClient
            //   .update({ TableName: TABLE_NAME, Key: { id } })
            //   .promise();
          } else {
            throw e;
          }
        }
      })
    );
  });

  try {
    await Promise.all(postCalls.flat());
  } catch (e) {
    console.error(e);
  }
};
