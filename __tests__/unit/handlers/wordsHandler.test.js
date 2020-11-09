const lambda = require('../../../src/handlers/saveWords.js');
const dynamodb = require('aws-sdk/clients/dynamodb');

describe('Test wordsHandler', () => {
  let updateSpy;

  beforeAll(() => {
    updateSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'update');
  });

  // Clean up mocks
  afterAll(() => {
    updateSpy.mockRestore();
  });

  it('should return total number of word entries', async () => {
    // Arrange
    const words = ['one', 'two', 'three'];

    updateSpy.mockReturnValue({
      promise: () =>
        Promise.resolve({ Attributes: { Words: words, numberOfEntries: 1 } }),
    });

    const event = {
      requestContext: {
        connectionId: 1,
      },
      body: JSON.stringify({
        action: 'savewords',
        id: 1,
        words,
      }),
    };

    const expectedResult = {
      statusCode: 201,
      body: JSON.stringify({ numberOfEntries: 1 }),
    };

    // Act
    const result = await lambda.handler(event);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
