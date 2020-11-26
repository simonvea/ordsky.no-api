'use strict';
const lambda = require('../../../src/start-session/index.js');
const dynamodb = require('aws-sdk/clients/dynamodb');

// jest.mock('aws-sdk');
// jest.mock('aws-xray-sdk');

describe('StartSession handler', () => {
  let putSpy;
  beforeAll(() => {
    // Mock dynamodb put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put');
  });

  // Clean up mocks
  afterAll(() => {
    putSpy.mockRestore();
  });

  it('responds with 200 if payload contains id and action is startsession', async () => {
    // Arrange
    const id = '2';
    // For some reason I need to mock a return value or else I get an IAM complaint in pipeline..
    putSpy.mockReturnValue({
      promise: () =>
        Promise.resolve({
          Attributes: {
            id,
          },
        }),
    });
    const event = {
      requestContext: {
        connectionId: 1,
      },
      body: JSON.stringify({
        action: 'startsession',
        id,
      }),
    };

    const expected = {
      statusCode: 200,
      body: JSON.stringify({
        message: `successfully started session with id ${id}`,
      }),
    };

    // Act
    const response = await lambda.handler(event);

    // Assert
    expect(response).toEqual(expected);
  });

  it('responds with statusCode 400 if missing id', async () => {
    // Arrange
    const event = {
      requestContext: {
        connectionId: 1,
      },
      body: JSON.stringify({
        action: 'startsession',
      }),
    };

    const expected = {
      statusCode: 400,
    };

    // Act
    const response = await lambda.handler(event);

    // Assert
    expect(response.statusCode).toEqual(expected.statusCode);
  });

  it('when payload contains id, calls dynamodb put', async () => {
    // Arrange
    putSpy.mockClear();
    const id = '12345';
    const connectionId = 1;
    const event = {
      requestContext: {
        connectionId,
      },
      body: JSON.stringify({
        action: 'startsession',
        id,
      }),
    };

    // Act
    await lambda.handler(event);

    // Assert
    expect(putSpy).toHaveBeenCalled();
  });
});
