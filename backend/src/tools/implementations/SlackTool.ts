import { BaseTool } from '../base/BaseTool.js';
import axios from 'axios';
import { logger } from '../../utils/logger.js';

export interface SlackParams {
  action: 'send_message' | 'list_channels' | 'create_channel' | 'upload_file' | 'get_user';
  channel?: string;
  text?: string;
  blocks?: any[];
  channelName?: string;
  isPrivate?: boolean;
  filePath?: string;
  fileName?: string;
  userId?: string;
}

export class SlackTool extends BaseTool {
  private botToken: string;
  private baseUrl = 'https://slack.com/api';

  constructor(botToken?: string) {
    super(
      'slack_manager',
      'Interact with Slack (send messages, manage channels, upload files)',
      {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['send_message', 'list_channels', 'create_channel', 'upload_file', 'get_user'],
            description: 'Action to perform',
          },
          channel: {
            type: 'string',
            description: 'Channel ID or name',
          },
          text: {
            type: 'string',
            description: 'Message text',
          },
          blocks: {
            type: 'array',
            description: 'Slack Block Kit blocks',
          },
          channelName: {
            type: 'string',
            description: 'Name for new channel',
          },
          isPrivate: {
            type: 'boolean',
            description: 'Whether channel should be private',
          },
          fileName: {
            type: 'string',
            description: 'Name of file to upload',
          },
          userId: {
            type: 'string',
            description: 'Slack user ID',
          },
        },
        required: ['action'],
      }
    );

    this.botToken = botToken || process.env.SLACK_BOT_TOKEN || '';
  }

  async execute(params: SlackParams): Promise<any> {
    return this.executeWithLogging(params, async () => {
      if (!this.botToken) {
        throw new Error('Slack bot token not configured');
      }

      switch (params.action) {
        case 'send_message':
          return this.sendMessage(params);
        case 'list_channels':
          return this.listChannels();
        case 'create_channel':
          return this.createChannel(params);
        case 'upload_file':
          return this.uploadFile(params);
        case 'get_user':
          return this.getUser(params);
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    });
  }

  private async sendMessage(params: SlackParams) {
    if (!params.channel || !params.text) {
      throw new Error('channel and text are required for sending a message');
    }

    const response = await axios.post(
      `${this.baseUrl}/chat.postMessage`,
      {
        channel: params.channel,
        text: params.text,
        blocks: params.blocks,
      },
      {
        headers: {
          Authorization: `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      messageId: response.data.ts,
      channel: response.data.channel,
      text: params.text,
      status: 'sent',
    };
  }

  private async listChannels() {
    const response = await axios.get(`${this.baseUrl}/conversations.list`, {
      params: {
        types: 'public_channel,private_channel',
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${this.botToken}`,
      },
    });

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channels: response.data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        memberCount: channel.num_members,
        topic: channel.topic?.value,
      })),
      count: response.data.channels.length,
    };
  }

  private async createChannel(params: SlackParams) {
    if (!params.channelName) {
      throw new Error('channelName is required for creating a channel');
    }

    const endpoint = params.isPrivate
      ? 'conversations.create'
      : 'conversations.create';

    const response = await axios.post(
      `${this.baseUrl}/${endpoint}`,
      {
        name: params.channelName,
        is_private: params.isPrivate || false,
      },
      {
        headers: {
          Authorization: `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return {
      channelId: response.data.channel.id,
      channelName: response.data.channel.name,
      isPrivate: response.data.channel.is_private,
      status: 'created',
    };
  }

  private async uploadFile(params: SlackParams) {
    if (!params.channel || !params.fileName) {
      throw new Error('channel and fileName are required for uploading a file');
    }

    // Simulated for now - requires actual file content
    logger.info('[SlackTool] Simulating file upload', {
      channel: params.channel,
      fileName: params.fileName,
    });

    return {
      fileId: `F${Date.now()}`,
      fileName: params.fileName,
      channel: params.channel,
      status: 'uploaded',
      message: 'File upload simulated (requires actual file content)',
    };
  }

  private async getUser(params: SlackParams) {
    if (!params.userId) {
      throw new Error('userId is required for getting user info');
    }

    const response = await axios.get(`${this.baseUrl}/users.info`, {
      params: {
        user: params.userId,
      },
      headers: {
        Authorization: `Bearer ${this.botToken}`,
      },
    });

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const user = response.data.user;

    return {
      userId: user.id,
      name: user.name,
      realName: user.real_name,
      email: user.profile?.email,
      title: user.profile?.title,
      isBot: user.is_bot,
      timezone: user.tz,
    };
  }
}

// Production usage:
/*
const slackTool = new SlackTool(process.env.SLACK_BOT_TOKEN);

// Send message
await slackTool.execute({
  action: 'send_message',
  channel: '#general',
  text: 'Hello from AI Agent!'
});

// Send rich message with blocks
await slackTool.execute({
  action: 'send_message',
  channel: '#general',
  text: 'Fallback text',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Task Completed!*\nYour workflow has finished successfully.'
      }
    }
  ]
});

// List channels
await slackTool.execute({
  action: 'list_channels'
});

// Create channel
await slackTool.execute({
  action: 'create_channel',
  channelName: 'ai-notifications',
  isPrivate: false
});
*/
