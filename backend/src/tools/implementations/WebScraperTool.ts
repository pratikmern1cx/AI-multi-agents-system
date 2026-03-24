import { BaseTool } from '../base/BaseTool.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger.js';

export interface WebScraperParams {
  url: string;
  selector?: string;
  extractType?: 'text' | 'html' | 'links' | 'images';
}

export class WebScraperTool extends BaseTool {
  constructor() {
    super(
      'web_scraper',
      'Scrape content from a web page',
      {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to scrape',
          },
          selector: {
            type: 'string',
            description: 'CSS selector to extract specific content (optional)',
          },
          extractType: {
            type: 'string',
            enum: ['text', 'html', 'links', 'images'],
            description: 'Type of content to extract',
          },
        },
        required: ['url'],
      }
    );
  }

  async execute(params: WebScraperParams): Promise<any> {
    return this.executeWithLogging(params, async () => {
      // Validate URL
      if (!this.isValidUrl(params.url)) {
        throw new Error(`Invalid URL: ${params.url}`);
      }

      logger.info('[WebScraperTool] Fetching URL', { url: params.url });

      // Fetch the page
      const response = await axios.get(params.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      let content: any;

      if (params.selector) {
        // Extract specific content using selector
        content = this.extractWithSelector($, params.selector, params.extractType || 'text');
      } else {
        // Extract based on type
        content = this.extractByType($, params.extractType || 'text');
      }

      return {
        url: params.url,
        title: $('title').text(),
        content,
        timestamp: new Date().toISOString(),
      };
    });
  }

  private extractWithSelector($: cheerio.CheerioAPI, selector: string, extractType: string): any {
    const elements = $(selector);

    switch (extractType) {
      case 'text':
        return elements
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((text) => text.length > 0);

      case 'html':
        return elements
          .map((_, el) => $(el).html())
          .get();

      case 'links':
        return elements
          .find('a')
          .map((_, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href'),
          }))
          .get();

      case 'images':
        return elements
          .find('img')
          .map((_, el) => ({
            alt: $(el).attr('alt'),
            src: $(el).attr('src'),
          }))
          .get();

      default:
        return elements.text().trim();
    }
  }

  private extractByType($: cheerio.CheerioAPI, extractType: string): any {
    switch (extractType) {
      case 'text':
        return $('body').text().trim().replace(/\s+/g, ' ');

      case 'html':
        return $('body').html();

      case 'links':
        return $('a')
          .map((_, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href'),
          }))
          .get()
          .filter((link) => link.href);

      case 'images':
        return $('img')
          .map((_, el) => ({
            alt: $(el).attr('alt'),
            src: $(el).attr('src'),
          }))
          .get()
          .filter((img) => img.src);

      default:
        return $('body').text().trim();
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
