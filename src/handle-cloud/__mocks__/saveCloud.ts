import { WordCount } from '../saveCloud';

export async function saveCloudToId(
  cloud: any,
  id: string,
  wordCount: WordCount = [{ text: '', count: 0 }]
) {
  return Promise.resolve({ ConsumedCapacity: 2 });
}
