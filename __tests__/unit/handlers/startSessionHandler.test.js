'use strict';
const lambda = require('../../../src/handlers/startSession.js');
const dynamodb = require('aws-sdk/clients/dynamodb');

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

    const event = {
      body: JSON.stringify({
        action: 'startsession',
        id: '2',
      }),
    };

    const expected = {
      statusCode: 200,
    };

    // Act
    const response = await lambda.handler(event);

    // Assert
    expect(response).toEqual(expected);
  });

  it('responds with statusCode 400 if missing id', async () => {
    // Arrange
    const event = {
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
  it('responds with statusCode 500 if it is invoked on wrong action', async () => {
    // Arrange
    const event = {
      body: JSON.stringify({
        action: 'savewords',
      }),
    };

    const expected = {
      statusCode: 500,
    };

    // Act
    const response = await lambda.handler(event);

    // Assert
    expect(response.statusCode).toEqual(expected.statusCode);
  });
  it('when payload contains id, saves id to dynamodb table', async () => {
    // Arrange
    putSpy.mockClear();
    const id = '12345';
    const event = {
      body: JSON.stringify({
        action: 'startsession',
        id,
      }),
    };

    const tableName = process.env.SESSION_TABLE;

    const expected = {
      TableName: tableName,
      Item: JSON.stringify({
        id,
      }),
    };

    // Act
    await lambda.handler(event);

    // Assert
    expect(putSpy).toHaveBeenCalledWith(expected);
  });
});
