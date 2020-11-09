const lambda = require('../../../src/handlers/saveCloud.js');
const dynamodb = require('aws-sdk/clients/dynamodb');

describe('Test cloudHandler', () => {
  let updateSpy;

  beforeAll(() => {
    // Mock dynamodb update methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    updateSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'update');
  });

  // Clean up mocks
  afterAll(() => {
    updateSpy.mockRestore();
  });

  it('should return statusCode 201', async () => {
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

    updateSpy.mockReturnValue({
      promise: () => Promise.resolve(),
    });

    const event = {
      requestContext: {
        connectionId: 1,
      },
      body: JSON.stringify({
        action: 'savecloud',
        id: 1,
        cloud,
      }),
    };

    const expectedResult = {
      statusCode: 201,
    };

    // Act
    const result = await lambda.handler(event);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});
