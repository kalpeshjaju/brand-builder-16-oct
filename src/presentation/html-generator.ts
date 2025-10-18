// HTML Generator - Convert markdown and brand strategies to professional HTML

import { marked } from 'marked';
import type {
  HTMLGenerationOptions,
  HTMLDocument,
  BrandStrategy,
} from '../types/index.js';
import { FileSystemUtils } from '../utils/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HTMLGenerator {
  private template: string | null = null;

  async loadTemplate(theme: string = 'professional'): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', `${theme}.html`);
    this.template = await FileSystemUtils.readFile(templatePath);
  }

  /**
   * Convert markdown content to HTML
   */
  markdownToHTML(markdown: string): string {
    return marked.parse(markdown, {
      gfm: true,
      breaks: true,
    }) as string;
  }

  /**
   * Generate HTML from brand strategy
   */
  async generateFromStrategy(
    strategy: BrandStrategy,
    brandName: string,
    options: HTMLGenerationOptions = {}
  ): Promise<HTMLDocument> {
    const {
      title = `${brandName} Brand Strategy`,
      theme = 'professional',
      includeTOC = true,
      includeMetadata = true,
      customCSS = '',
    } = options;

    // Load template
    if (!this.template) {
      await this.loadTemplate(theme);
    }

    if (!this.template) {
      throw new Error('Failed to load HTML template');
    }

    // Build content sections
    const sections: string[] = [];

    // Purpose & Mission
    if (strategy.purpose || strategy.mission || strategy.vision) {
      sections.push('<section class="section">');
      sections.push('<h2 id="foundation">Brand Foundation</h2>');

      if (strategy.purpose) {
        sections.push('<h3>Purpose</h3>');
        sections.push(`<p>${strategy.purpose}</p>`);
      }

      if (strategy.mission) {
        sections.push('<h3>Mission</h3>');
        sections.push(`<p>${strategy.mission}</p>`);
      }

      if (strategy.vision) {
        sections.push('<h3>Vision</h3>');
        sections.push(`<p>${strategy.vision}</p>`);
      }

      sections.push('</section>');
    }

    // Values
    if (strategy.values && strategy.values.length > 0) {
      sections.push('<section class="section">');
      sections.push('<h2 id="values">Core Values</h2>');
      sections.push('<ul>');
      strategy.values.forEach(value => {
        sections.push(`<li>${value}</li>`);
      });
      sections.push('</ul>');
      sections.push('</section>');
    }

    // Positioning
    if (strategy.positioning) {
      sections.push('<section class="section">');
      sections.push('<h2 id="positioning">Brand Positioning</h2>');
      sections.push(`<p>${strategy.positioning}</p>`);
      sections.push('</section>');
    }

    // Personality
    if (strategy.personality && strategy.personality.length > 0) {
      sections.push('<section class="section">');
      sections.push('<h2 id="personality">Brand Personality</h2>');
      sections.push('<ul>');
      strategy.personality.forEach(trait => {
        sections.push(`<li>${trait}</li>`);
      });
      sections.push('</ul>');
      sections.push('</section>');
    }

    // Voice & Tone
    if (strategy.voiceAndTone) {
      sections.push('<section class="section">');
      sections.push('<h2 id="voice">Voice & Tone</h2>');

      if (strategy.voiceAndTone.voice) {
        sections.push('<h3>Brand Voice</h3>');
        sections.push(`<p>${strategy.voiceAndTone.voice}</p>`);
      }

      if (strategy.voiceAndTone.toneAttributes && strategy.voiceAndTone.toneAttributes.length > 0) {
        sections.push('<h3>Tone Attributes</h3>');
        sections.push('<ul>');
        strategy.voiceAndTone.toneAttributes.forEach(attr => {
          sections.push(`<li>${attr}</li>`);
        });
        sections.push('</ul>');
      }

      sections.push('</section>');
    }

    // Key Messages
    if (strategy.keyMessages && strategy.keyMessages.length > 0) {
      sections.push('<section class="section">');
      sections.push('<h2 id="messages">Key Messages</h2>');
      sections.push('<ol>');
      strategy.keyMessages.forEach(message => {
        sections.push(`<li>${message}</li>`);
      });
      sections.push('</ol>');
      sections.push('</section>');
    }

    // Differentiators
    if (strategy.differentiators && strategy.differentiators.length > 0) {
      sections.push('<section class="section">');
      sections.push('<h2 id="differentiation">Competitive Differentiation</h2>');
      sections.push('<ul>');
      strategy.differentiators.forEach(diff => {
        sections.push(`<li>${diff}</li>`);
      });
      sections.push('</ul>');
      sections.push('</section>');
    }

    // Build TOC
    let tocHTML = '';
    if (includeTOC) {
      tocHTML = `
        <nav>
          <h2>Table of Contents</h2>
          <ul>
            <li><a href="#foundation">Brand Foundation</a></li>
            <li><a href="#values">Core Values</a></li>
            <li><a href="#positioning">Brand Positioning</a></li>
            <li><a href="#personality">Brand Personality</a></li>
            <li><a href="#voice">Voice & Tone</a></li>
            <li><a href="#messages">Key Messages</a></li>
            <li><a href="#differentiation">Competitive Differentiation</a></li>
          </ul>
        </nav>
      `;
    }

    // Build metadata
    let metadataHTML = '';
    if (includeMetadata) {
      const now = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      metadataHTML = `
        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Brand:</span>
            <span>${brandName}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Generated:</span>
            <span>${now}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Format:</span>
            <span>HTML</span>
          </div>
        </div>
      `;
    }

    // Replace template placeholders
    let html = this.template
      .replace('{{TITLE}}', this.escapeHTML(title))
      .replace('{{SUBTITLE}}', `<p class="subtitle">Professional Brand Strategy Document</p>`)
      .replace('{{METADATA}}', metadataHTML)
      .replace('{{TOC}}', tocHTML)
      .replace('{{CONTENT}}', sections.join('\n'))
      .replace('{{CUSTOM_CSS}}', customCSS ? `<style>${customCSS}</style>` : '')
      .replace('{{GENERATED_AT}}', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    return {
      html,
      metadata: {
        generatedAt: new Date().toISOString(),
        brandName,
        format: 'html',
        theme,
      },
    };
  }

  /**
   * Generate HTML from markdown content
   */
  async generateFromMarkdown(
    markdown: string,
    options: HTMLGenerationOptions = {}
  ): Promise<HTMLDocument> {
    const {
      title = 'Brand Strategy Report',
      theme = 'professional',
      includeMetadata = true,
      customCSS = '',
    } = options;

    // Load template
    if (!this.template) {
      await this.loadTemplate(theme);
    }

    if (!this.template) {
      throw new Error('Failed to load HTML template');
    }

    // Convert markdown to HTML
    const contentHTML = this.markdownToHTML(markdown);

    // Build metadata
    let metadataHTML = '';
    if (includeMetadata) {
      const now = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      metadataHTML = `
        <div class="metadata">
          <div class="metadata-item">
            <span class="metadata-label">Generated:</span>
            <span>${now}</span>
          </div>
          <div class="metadata-item">
            <span class="metadata-label">Format:</span>
            <span>HTML</span>
          </div>
        </div>
      `;
    }

    // Replace template placeholders
    let html = this.template
      .replace('{{TITLE}}', this.escapeHTML(title))
      .replace('{{SUBTITLE}}', '')
      .replace('{{METADATA}}', metadataHTML)
      .replace('{{TOC}}', '')
      .replace('{{CONTENT}}', contentHTML)
      .replace('{{CUSTOM_CSS}}', customCSS ? `<style>${customCSS}</style>` : '')
      .replace('{{GENERATED_AT}}', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    return {
      html,
      metadata: {
        generatedAt: new Date().toISOString(),
        brandName: 'Unknown',
        format: 'html',
        theme,
      },
    };
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m] || m);
  }
}
