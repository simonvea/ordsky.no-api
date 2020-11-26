const lambda = require('../../../src/save-words/index.js');
const dynamodb = require('aws-sdk/clients/dynamodb');
const apigatewaymanagementapi = require('aws-sdk/clients/apigatewaymanagementapi');

describe('Test wordsHandler', () => {
  let updateSpy;

  const gwMock = jest.fn(() => ({ promise: jest.fn() }));

  beforeAll(() => {
    updateSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'update');
    Object.defineProperty(
      apigatewaymanagementapi.prototype,
      'postToConnection',
      {
        value: gwMock,
      }
    );
  });

  // Clean up mocks
  afterAll(() => {
    updateSpy.mockRestore();
  });

  it('should send total number of word entries to connections', async () => {
    // Arrange
    const words = ['one', 'two', 'three'];
    const connectionIds = { values: ['12125512'] };

    updateSpy.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Attributes: {
            Words: words,
            numberOfEntries: 1,
            connectionIds,
          },
        }),
    });

    const event = {
      requestContext: {
        connectionId: 1,
        domainName: 'api.ordsky.no',
      },
      body: JSON.stringify({
        action: 'savewords',
        id: 1,
        words,
      }),
    };

    const expectedResult = {
      ConnectionId: connectionIds.values[0],
      Data: JSON.stringify({
        type: 'WORDS_ADDED',
        numberOfEntries: 1,
      }),
    };

    // Act
    const result = await lambda.handler(event);

    // Assert
    expect(gwMock).toHaveBeenCalledWith(expectedResult);
  });
});
