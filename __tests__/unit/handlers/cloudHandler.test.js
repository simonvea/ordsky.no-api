const lambda = require('../../../src/handle-cloud/index.js');
const dynamodb = require('aws-sdk/clients/dynamodb');
const apigatewaymanagementapi = require('aws-sdk/clients/apigatewaymanagementapi');

describe('Test cloudHandler', () => {
  let updateSpy;
  const gwMock = jest.fn(() => ({ promise: jest.fn() }));

  beforeAll(() => {
    updateSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'get');
  });

  // Clean up mocks
  afterAll(() => {
    updateSpy.mockRestore();
  });

  it('should send cloud to connections', async () => {
    // Arrange
    const cloud = [
      { text: 'I', size: 70, fill: '#14a825' },
      { text: 'PÅ', size: 36.61538461538462, fill: '#57d16a' },
      { text: 'OG', size: 36.61538461538462, fill: '#16ad7d' },
      { text: 'ER', size: 35.53846153846153, fill: '#e0c070' },
      { text: 'DET', size: 33.38461538461539, fill: '#97efdd' },
      { text: 'TIL', size: 21.53846153846154, fill: '#06549e' },
      { text: 'FOR', size: 20, fill: '#2f89d8' },
      { text: 'SOM', size: 20, fill: '#aa2927' },
    ];

    const connectionIds = { values: ['12125512'] };

    updateSpy.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Item: {
            connectionIds,
          },
          ConsumedCapacity: {
            TableName: 'OrdskySession',
          },
        }),
    });

    Object.defineProperty(
      apigatewaymanagementapi.prototype,
      'postToConnection',
      {
        value: gwMock,
      }
    );

    const event = {
      requestContext: {
        connectionId: 1,
        domainName: 'api.ordsky.no',
      },
      body: JSON.stringify({
        action: 'savecloud',
        id: 1,
        cloud,
      }),
    };

    const expectedResult = {
      ConnectionId: connectionIds.values[0],
      Data: JSON.stringify({
        type: 'CLOUD_CREATED',
        cloud,
      }),
    };

    // Act
    await lambda.handler(event);

    // Assert
    expect(gwMock).toHaveBeenCalledWith(expectedResult);
  });
});
