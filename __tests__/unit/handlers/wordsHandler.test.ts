import { handler } from '../../../src/save-words/index';
import { sendToConnections } from 'gw-helpers';
import { saveWordsAndConnectionId } from '../../../src/save-words/saveWords';
import { APIGatewayEvent } from 'aws-lambda';

jest.mock('gw-helpers');
jest.mock('../../../src/save-words/saveWords');

describe('Test wordsHandler', () => {
  it('should send total number of word entries to connections', async () => {
    // Arrange
    const words = ['one', 'two', 'three'];
    const connectionIds = { values: ['12125512'] };

    (saveWordsAndConnectionId as jest.Mock).mockReturnValue(
      Promise.resolve({
        Words: words,
        numberOfEntries: 1,
        connectionIds,
      })
    );

    const event = {
      requestContext: {
        connectionId: '1',
        domainName: 'api.ordsky.no',
      },
      body: JSON.stringify({
        action: 'savewords',
        id: 1,
        words,
      }),
    };

    const expectedResult = {
      connections: connectionIds.values,
      message: {
        type: 'WORDS_ADDED',
        numberOfEntries: 1,
      },
    };

    // Act
    const result = await handler(event as APIGatewayEvent);

    // Assert
    expect(sendToConnections).toHaveBeenCalledWith(
      expect.objectContaining(expectedResult)
    );
  });
});
