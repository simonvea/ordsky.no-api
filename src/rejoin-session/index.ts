import { APIGatewayEvent } from 'aws-lambda';
import { saveConnectionId } from './saveConnection';
import { sendToConnections } from 'gw-helpers';

export const handler = async (event: APIGatewayEvent) => {
  console.info('received:', event);

  const { id } = JSON.parse(event.body as string);
  const { connectionId } = event.requestContext;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing id!',
      }),
    };
  }

  try {
    const result = await saveConnectionId(
      connectionId as string,
      id.toString()
    );
    console.info('successfully saved new connectionId');

    const message = {
      type: 'rejoined',
      numberOfEntries: result.numberOfEntries,
    };

    await sendToConnections({ message, connections: [connectionId as string] });

    console.info("successfully sent 'rejoined' message to connectionId");
  } catch (e) {
    console.error('failed to save id:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Failed to save id: ${e}`,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `successfully rejoined session with id ${id}`,
      words: [],
    }),
  };
};
