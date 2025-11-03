export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

export interface CreatePageParams {
  databaseId: string;
  properties: Record<string, any>;
  content?: any[];
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}
