import { BaseTool } from '../base/BaseTool.js';
import axios from 'axios';
import { logger } from '../../utils/logger.js';

export interface GitHubParams {
  action:
    | 'create_issue'
    | 'list_issues'
    | 'create_pr'
    | 'list_prs'
    | 'get_repo'
    | 'search_code';
  owner?: string;
  repo?: string;
  title?: string;
  body?: string;
  labels?: string[];
  query?: string;
  state?: 'open' | 'closed' | 'all';
}

export class GitHubTool extends BaseTool {
  private apiKey: string;
  private baseUrl = 'https://api.github.com';

  constructor(apiKey?: string) {
    super(
      'github_manager',
      'Interact with GitHub (issues, PRs, repos, code search)',
      {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create_issue', 'list_issues', 'create_pr', 'list_prs', 'get_repo', 'search_code'],
            description: 'Action to perform',
          },
          owner: {
            type: 'string',
            description: 'Repository owner (username or org)',
          },
          repo: {
            type: 'string',
            description: 'Repository name',
          },
          title: {
            type: 'string',
            description: 'Issue or PR title',
          },
          body: {
            type: 'string',
            description: 'Issue or PR body',
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            description: 'Labels for issue',
          },
          query: {
            type: 'string',
            description: 'Search query',
          },
          state: {
            type: 'string',
            enum: ['open', 'closed', 'all'],
            description: 'Issue/PR state filter',
          },
        },
        required: ['action'],
      }
    );

    this.apiKey = apiKey || process.env.GITHUB_TOKEN || '';
  }

  async execute(params: GitHubParams): Promise<any> {
    return this.executeWithLogging(params, async () => {
      if (!this.apiKey) {
        throw new Error('GitHub API token not configured');
      }

      switch (params.action) {
        case 'create_issue':
          return this.createIssue(params);
        case 'list_issues':
          return this.listIssues(params);
        case 'create_pr':
          return this.createPR(params);
        case 'list_prs':
          return this.listPRs(params);
        case 'get_repo':
          return this.getRepo(params);
        case 'search_code':
          return this.searchCode(params);
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    });
  }

  private async createIssue(params: GitHubParams) {
    if (!params.owner || !params.repo || !params.title) {
      throw new Error('owner, repo, and title are required for creating an issue');
    }

    const response = await axios.post(
      `${this.baseUrl}/repos/${params.owner}/${params.repo}/issues`,
      {
        title: params.title,
        body: params.body,
        labels: params.labels,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      issueNumber: response.data.number,
      url: response.data.html_url,
      title: response.data.title,
      state: response.data.state,
    };
  }

  private async listIssues(params: GitHubParams) {
    if (!params.owner || !params.repo) {
      throw new Error('owner and repo are required for listing issues');
    }

    const response = await axios.get(
      `${this.baseUrl}/repos/${params.owner}/${params.repo}/issues`,
      {
        params: {
          state: params.state || 'open',
          per_page: 30,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      issues: response.data.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        labels: issue.labels.map((l: any) => l.name),
        createdAt: issue.created_at,
      })),
      count: response.data.length,
    };
  }

  private async createPR(params: GitHubParams) {
    if (!params.owner || !params.repo || !params.title) {
      throw new Error('owner, repo, and title are required for creating a PR');
    }

    // Simulated for now - requires head and base branches
    logger.info('[GitHubTool] Simulating PR creation', {
      owner: params.owner,
      repo: params.repo,
    });

    return {
      prNumber: Math.floor(Math.random() * 1000),
      url: `https://github.com/${params.owner}/${params.repo}/pull/123`,
      title: params.title,
      state: 'open',
      message: 'PR creation simulated (requires head and base branches)',
    };
  }

  private async listPRs(params: GitHubParams) {
    if (!params.owner || !params.repo) {
      throw new Error('owner and repo are required for listing PRs');
    }

    const response = await axios.get(
      `${this.baseUrl}/repos/${params.owner}/${params.repo}/pulls`,
      {
        params: {
          state: params.state || 'open',
          per_page: 30,
        },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      pullRequests: response.data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        url: pr.html_url,
        createdAt: pr.created_at,
        author: pr.user.login,
      })),
      count: response.data.length,
    };
  }

  private async getRepo(params: GitHubParams) {
    if (!params.owner || !params.repo) {
      throw new Error('owner and repo are required for getting repo info');
    }

    const response = await axios.get(
      `${this.baseUrl}/repos/${params.owner}/${params.repo}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      url: response.data.html_url,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      openIssues: response.data.open_issues_count,
      language: response.data.language,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  }

  private async searchCode(params: GitHubParams) {
    if (!params.query) {
      throw new Error('query is required for code search');
    }

    const response = await axios.get(`${this.baseUrl}/search/code`, {
      params: {
        q: params.query,
        per_page: 10,
      },
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      totalCount: response.data.total_count,
      items: response.data.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        url: item.html_url,
        repository: item.repository.full_name,
      })),
    };
  }
}

// Production usage:
/*
const githubTool = new GitHubTool(process.env.GITHUB_TOKEN);

// Create issue
await githubTool.execute({
  action: 'create_issue',
  owner: 'username',
  repo: 'repo-name',
  title: 'Bug: Something is broken',
  body: 'Description of the bug',
  labels: ['bug', 'high-priority']
});

// List issues
await githubTool.execute({
  action: 'list_issues',
  owner: 'username',
  repo: 'repo-name',
  state: 'open'
});

// Search code
await githubTool.execute({
  action: 'search_code',
  query: 'function addClass repo:username/repo-name'
});
*/
