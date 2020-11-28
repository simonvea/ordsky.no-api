'use strict';
import { saveCloudToId } from './saveCloud';
import { sendToConnections, getConnections } from 'gw-helpers';

/**
 * Updates table with cloud.
 */
export const handler = async (event: any) => {
  // All log statements are written to CloudWatch
  console.info('received:', event);

  const { id, cloud } = JSON.parse(event.body);
  const { domainName, stage } = event.requestContext;

  // TODO: See if this can be checked by API GW
  if (!id || !cloud) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'The request needs id and cloud',
      }),
    };
  }

  let connections;
  try {
    connections = await getConnections(id);
  } catch (e) {
    console.error('Failed to get connectionIds:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to get session connections.',
      }),
    };
  }

  const endpoint = domainName.includes('ordsky') // Custom domain names already includes stage
    ? `https://${domainName}`
    : `https://${domainName}/${stage}`;

  const message = {
    type: 'CLOUD_CREATED',
    cloud,
  };

  try {
    await sendToConnections({
      message,
      endpoint,
      connections,
    });

    console.info('Successfully sendt cloud to connections.');
  } catch (e) {
    console.error('Failed to send cloud to connections', e);
  }

  try {
    const result = await saveCloudToId(cloud, id);
    console.info(
      'Successfully updated database with cloud, consumed write capacity:',
      result.ConsumedCapacity
    );
  } catch (e) {
    console.error('Failed to update db with cloud:', e);

    // TODO: Push to DLQ?
  }

  return { statusCode: 200, body: JSON.stringify(message) }; // TODO: Should response be included?
};
