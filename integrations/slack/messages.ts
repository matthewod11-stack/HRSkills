import { slackClient } from './client';
import { SlackMessage } from './types';

export async function sendMessage(params: SlackMessage) {
  const client = slackClient.getClient();

  return await client.chat.postMessage({
    channel: params.channel,
    text: params.text,
    blocks: params.blocks,
    thread_ts: params.thread_ts
  });
}

export async function sendDM(userId: string, text: string, blocks?: any[]) {
  const client = slackClient.getClient();

  // Open DM channel
  const conversation = await client.conversations.open({
    users: userId
  });

  return await sendMessage({
    channel: conversation.channel!.id!,
    text,
    blocks
  });
}

export async function findUserByEmail(email: string) {
  const client = slackClient.getClient();

  return await client.users.lookupByEmail({ email });
}
