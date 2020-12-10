import { handler } from '../../../src/handle-cloud/index';
import { sendToConnections, getConnections } from 'gw-helpers';

jest.mock('gw-helpers');
jest.mock('../../../src/handle-cloud/saveCloud');

describe('Test cloudHandler', () => {
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

    (getConnections as jest.Mock).mockReturnValue(
      Promise.resolve(connectionIds.values)
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
      connections: connectionIds.values,
      message: {
        type: 'CLOUD_CREATED',
        cloud,
      },
    };

    // Act
    await handler(event);

    // Assert
    expect(sendToConnections).toHaveBeenCalledWith(expectedResult);
  });
});
