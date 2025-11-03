import { notionClient } from './client';
import { CreatePageParams } from './types';

export async function createPage(params: CreatePageParams) {
  const client = notionClient.getClient();

  return await client.pages.create({
    parent: { database_id: params.databaseId },
    properties: params.properties,
    children: params.content || []
  });
}

export async function updatePage(pageId: string, properties: Record<string, any>) {
  const client = notionClient.getClient();

  return await client.pages.update({
    page_id: pageId,
    properties
  });
}

export async function getPage(pageId: string) {
  const client = notionClient.getClient();

  return await client.pages.retrieve({ page_id: pageId });
}
