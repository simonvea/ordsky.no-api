'use strict';
import { APIGatewayEvent } from 'aws-lambda';
import { removeConnectionId, sendToConnections } from 'gw-helpers';
import { saveWordsAndConnectionId } from './saveWords';

/**
 * Updates table with words.
 */
export const handler = async (event: APIGatewayEvent) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, words } = JSON.parse(event.body!);
  const { connectionId } = event.requestContext;

  if (!id || !words) {
    console.info('The request was missing id or words');
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and words.',
      }),
    };
  }

  let result;
  try {
    result = await saveWordsAndConnectionId(words, connectionId!, id);
  } catch (e) {
    console.error('Failed to save to db. Error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to save words.',
      }),
    };
  }

  const { numberOfEntries, connectionIds } = result;
  const connections = Array.from(connectionIds);

  const message = {
    type: 'WORDS_ADDED',
    numberOfEntries,
  };

  const onStaleConnection = async (connectionId: string) => {
    await removeConnectionId(connectionId, id);
  };

  try {
    await sendToConnections({
      message,
      connections,
      onStaleConnection,
    });

    console.info(
      `Successfully sendt number of entries to connections: ${numberOfEntries}`
    );
  } catch (e) {
    console.error('Failed to send cloud to connections', e);
  }

  return { statusCode: 200, body: JSON.stringify(message) }; // TODO: Should response be included?
};
