import { notionClient } from './client';

export async function queryDatabase(databaseId: string, filter?: any, sorts?: any[]) {
  const client = notionClient.getClient();

  return await client.databases.query({
    database_id: databaseId,
    filter,
    sorts
  });
}

export async function getDatabase(databaseId: string) {
  const client = notionClient.getClient();

  return await client.databases.retrieve({ database_id: databaseId });
}
