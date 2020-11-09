const lambda = require('../../../src/handlers/dynamoDBStream.js');
const AWS = require('aws-sdk');
const dynamodb = require('aws-sdk/clients/dynamodb');
const apigwManagementApi = require('aws-sdk/clients/apigatewaymanagementapi');

jest.mock('aws-sdk');

describe('dynamoDBStream', () => {
  // let getSpy;
  // let gatewaySpy;

  // beforeAll(() => {
  //   // Mock dynamodb get and put methods
  //   // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
  //   getSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'update');
  //   gatewaySpy = jest.spyOn(apigwManagementApi.prototype, 'postToConnection');
  // });

  // afterAll(() => {
  //   getSpy.mockRestore();
  //   gatewaySpy.mockRestore();
  // });

  it('runs without error', async () => {
    const event = {
      Records: [
        {
          eventName: 'MODIFY',
          dynamodb: {
            Keys: {
              id: {
                S: '12345',
              },
            },
            OldImage: {
              id: {
                S: '12345',
              },
              connectionIds: {
                L: ['agsadgø'],
              },
            },
            NewImage: {
              id: {
                S: '12345',
              },
              connectionIds: {
                L: ['agsadgø', 'agasgasg?'],
              },
            },
          },
        },
      ],
    };

    // AWS.ApiGatewayManagementApi.postToConnection.mockImplementation(() =>
    //   Promise.resolve()
    // );

    await lambda.handler(event);

    expect(true).toBeTruthy();
  });
  it('should delete stale connectionIds', async () => {});
});
