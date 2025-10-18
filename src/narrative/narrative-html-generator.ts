// Narrative HTML Generator - Create comprehensive 6-act HTML package

import type { NarrativeStructure, NarrativeAct, NarrativeDocument } from '../types/index.js';
import { marked } from 'marked';

export class NarrativeHTMLGenerator {
  /**
   * Generate comprehensive HTML package from narrative structure
   */
  async generatePackage(narrative: NarrativeStructure): Promise<string> {
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(narrative));

    // Master Navigation (Table of Contents)
    sections.push(this.generateMasterNav(narrative));

    // Act summaries
    sections.push(this.generateActSummaries(narrative));

    // All acts with documents
    narrative.acts.forEach(act => {
      sections.push(this.generateAct(act));
    });

    // Footer
    sections.push(this.generateFooter(narrative));

    // Wrap in HTML template
    return this.wrapInTemplate(narrative.title, sections.join('\n\n'));
  }

  /**
   * Generate header section
   */
  private generateHeader(narrative: NarrativeStructure): string {
    return `
<header class="master-header">
  <h1>${narrative.title}</h1>
  <p class="subtitle">${narrative.subtitle || 'Complete Brand Strategy Package'}</p>

  <div class="package-metadata">
    <div class="metadata-item">
      <span class="label">Brand:</span>
      <span class="value">${narrative.brandName}</span>
    </div>
    <div class="metadata-item">
      <span class="label">Documents:</span>
      <span class="value">${narrative.metadata.totalDocuments}</span>
    </div>
    <div class="metadata-item">
      <span class="label">Words:</span>
      <span class="value">${narrative.metadata.totalWords.toLocaleString()}</span>
    </div>
    <div class="metadata-item">
      <span class="label">Generated:</span>
      <span class="value">${new Date(narrative.metadata.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</span>
    </div>
  </div>

  <div class="package-structure">
    <h2>Package Structure</h2>
    <p class="structure-diagram">
      ACT 1: WHO WE ARE →
      ACT 2: WHERE WE ARE TODAY →
      ACT 3: WHAT WE DISCOVERED →
      ACT 4: WHERE WE SHOULD GO →
      ACT 5: IS THIS READY? →
      ACT 6: HOW WE EXECUTE
    </p>
  </div>
</header>
    `.trim();
  }

  /**
   * Generate master navigation
   */
  private generateMasterNav(narrative: NarrativeStructure): string {
    const navItems: string[] = [];

    narrative.acts.forEach(act => {
      navItems.push(`
        <li class="nav-act">
          <a href="#act-${act.actNumber}" class="act-link">
            <strong>ACT ${act.actNumber}: ${act.title}</strong>
          </a>
          <p class="act-description">${act.description}</p>
          <ul class="nav-documents">
            ${act.documents.map(doc => `
              <li><a href="#${doc.id}">${doc.order}. ${doc.title}</a></li>
            `).join('')}
          </ul>
        </li>
      `);
    });

    return `
<nav class="master-nav">
  <h2>📚 Complete Package Navigation</h2>
  <ul class="nav-acts">
    ${navItems.join('')}
  </ul>
</nav>
    `.trim();
  }

  /**
   * Generate act summaries
   */
  private generateActSummaries(narrative: NarrativeStructure): string {
    const summaries: string[] = [];

    narrative.acts.forEach(act => {
      summaries.push(`
        <div class="act-summary">
          <h3>ACT ${act.actNumber}: ${act.title}</h3>
          <p>${act.description}</p>
          <div class="act-stats">
            <span>${act.documents.length} documents</span>
          </div>
        </div>
      `);
    });

    return `
<section class="acts-overview">
  <h2>🎬 Six-Act Structure Overview</h2>
  <div class="acts-grid">
    ${summaries.join('')}
  </div>
</section>
    `.trim();
  }

  /**
   * Generate a single act with all its documents
   */
  private generateAct(act: NarrativeAct): string {
    const documents = act.documents.map((doc: NarrativeDocument) => this.generateDocument(doc)).join('\n\n');

    return `
<section class="act" id="act-${act.actNumber}">
  <div class="act-header">
    <h2 class="act-title">ACT ${act.actNumber}: ${act.title}</h2>
    <p class="act-description">${act.description}</p>
    <div class="act-meta">
      <span class="doc-count">${act.documents.length} Documents</span>
    </div>
  </div>

  <div class="act-documents">
    ${documents}
  </div>
</section>
    `.trim();
  }

  /**
   * Generate a single document
   */
  private generateDocument(doc: NarrativeDocument): string {
    const contentHTML = marked.parse(doc.content, { gfm: true, breaks: true }) as string;

    return `
<article class="document" id="${doc.id}">
  <div class="document-header">
    <span class="document-number">${doc.order}</span>
    <h3 class="document-title">${doc.title}</h3>
    <span class="document-section">${doc.section}</span>
  </div>

  <div class="document-content">
    ${contentHTML}
  </div>
</article>
    `.trim();
  }

  /**
   * Generate footer
   */
  private generateFooter(narrative: NarrativeStructure): string {
    return `
<footer class="master-footer">
  <div class="footer-content">
    <h3>Next Steps</h3>
    <ol>
      <li>Review complete package with stakeholders</li>
      <li>Make Go/No-Go decision (see ACT 6, Document 22)</li>
      <li>Begin Phase 1 implementation if approved</li>
    </ol>

    <div class="footer-meta">
      <p><strong>${narrative.brandName}</strong> Brand Transformation Package</p>
      <p>Generated by Brand Builder Pro • ${new Date(narrative.metadata.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      <p>🤖 AI-Powered Brand Intelligence Operating System</p>
    </div>
  </div>
</footer>
    `.trim();
  }

  /**
   * Wrap content in HTML template with styling
   */
  private wrapInTemplate(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Highlight current section in navigation
        const sections = document.querySelectorAll('.act');
        const navLinks = document.querySelectorAll('.nav-act a');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollY >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get comprehensive CSS styles
   */
  private getStyles(): string {
    return `
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --background: #ffffff;
            --surface: #f8fafc;
            --border: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: var(--background);
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* Header */
        .master-header {
            text-align: center;
            padding: 60px 0;
            border-bottom: 3px solid var(--primary);
            margin-bottom: 60px;
        }

        .master-header h1 {
            font-size: 3em;
            color: var(--primary);
            margin-bottom: 15px;
            font-weight: 700;
        }

        .subtitle {
            font-size: 1.3em;
            color: var(--text-secondary);
            margin-bottom: 30px;
        }

        .package-metadata {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
            margin: 30px 0;
        }

        .metadata-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .metadata-item .label {
            font-size: 0.85em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metadata-item .value {
            font-size: 1.5em;
            font-weight: 600;
            color: var(--text-primary);
        }

        .package-structure {
            margin-top: 40px;
            padding: 30px;
            background: var(--surface);
            border-radius: 8px;
        }

        .package-structure h2 {
            font-size: 1.2em;
            margin-bottom: 15px;
            color: var(--text-primary);
        }

        .structure-diagram {
            font-size: 1.1em;
            color: var(--text-secondary);
            font-weight: 500;
        }

        /* Navigation */
        .master-nav {
            background: var(--surface);
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 60px;
            border: 1px solid var(--border);
        }

        .master-nav h2 {
            font-size: 1.8em;
            margin-bottom: 30px;
            color: var(--text-primary);
        }

        .nav-acts {
            list-style: none;
        }

        .nav-act {
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 1px solid var(--border);
        }

        .nav-act:last-child {
            border-bottom: none;
        }

        .act-link {
            color: var(--primary);
            text-decoration: none;
            font-size: 1.2em;
            transition: color 0.2s;
        }

        .act-link:hover {
            color: #1d4ed8;
        }

        .act-link.active {
            color: #1d4ed8;
            font-weight: 700;
        }

        .act-description {
            color: var(--text-secondary);
            margin: 10px 0 15px 0;
            font-size: 0.95em;
        }

        .nav-documents {
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .nav-documents li {
            margin: 0;
        }

        .nav-documents a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9em;
            transition: color 0.2s;
        }

        .nav-documents a:hover {
            color: var(--primary);
        }

        /* Acts Overview */
        .acts-overview {
            margin-bottom: 60px;
        }

        .acts-overview h2 {
            font-size: 2em;
            margin-bottom: 30px;
            color: var(--text-primary);
        }

        .acts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .act-summary {
            background: var(--surface);
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
        }

        .act-summary h3 {
            color: var(--primary);
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .act-summary p {
            color: var(--text-secondary);
            font-size: 0.9em;
            margin-bottom: 15px;
        }

        .act-stats {
            font-size: 0.85em;
            color: var(--text-muted);
        }

        /* Act Sections */
        .act {
            margin-bottom: 80px;
            scroll-margin-top: 20px;
        }

        .act-header {
            background: linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 40px;
        }

        .act-title {
            font-size: 2.5em;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .act-description {
            font-size: 1.2em;
            opacity: 0.95;
            margin-bottom: 20px;
        }

        .act-meta {
            font-size: 0.95em;
            opacity: 0.9;
        }

        .doc-count {
            background: rgba(255, 255, 255, 0.2);
            padding: 5px 15px;
            border-radius: 20px;
        }

        /* Documents */
        .act-documents {
            display: flex;
            flex-direction: column;
            gap: 40px;
        }

        .document {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            scroll-margin-top: 20px;
        }

        .document-header {
            background: white;
            padding: 20px 30px;
            border-bottom: 2px solid var(--border);
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .document-number {
            background: var(--primary);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.1em;
        }

        .document-title {
            flex: 1;
            font-size: 1.5em;
            color: var(--text-primary);
        }

        .document-section {
            font-size: 0.85em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .document-content {
            padding: 40px;
            background: white;
        }

        .document-content h1 {
            font-size: 2em;
            color: var(--text-primary);
            margin: 30px 0 20px 0;
        }

        .document-content h2 {
            font-size: 1.6em;
            color: var(--text-primary);
            margin: 25px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border);
        }

        .document-content h3 {
            font-size: 1.3em;
            color: var(--text-primary);
            margin: 20px 0 10px 0;
        }

        .document-content p {
            margin-bottom: 15px;
            line-height: 1.8;
        }

        .document-content ul,
        .document-content ol {
            margin: 15px 0 15px 30px;
        }

        .document-content li {
            margin-bottom: 8px;
        }

        .document-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .document-content th,
        .document-content td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }

        .document-content th {
            background: var(--surface);
            font-weight: 600;
        }

        .document-content tr:hover {
            background: var(--surface);
        }

        /* Footer */
        .master-footer {
            margin-top: 80px;
            padding-top: 40px;
            border-top: 3px solid var(--primary);
            text-align: center;
        }

        .footer-content h3 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: var(--text-primary);
        }

        .footer-content ol {
            display: inline-block;
            text-align: left;
            margin-bottom: 40px;
        }

        .footer-content ol li {
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .footer-meta {
            color: var(--text-secondary);
            font-size: 0.95em;
        }

        .footer-meta p {
            margin: 5px 0;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
            }

            .master-nav {
                page-break-after: always;
            }

            .act {
                page-break-before: always;
            }

            .document {
                page-break-inside: avoid;
            }

            a {
                color: var(--text-primary);
                text-decoration: none;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }

            .master-header h1 {
                font-size: 2em;
            }

            .package-metadata {
                gap: 20px;
            }

            .acts-grid {
                grid-template-columns: 1fr;
            }

            .act-title {
                font-size: 1.8em;
            }

            .document-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .nav-documents {
                grid-template-columns: 1fr;
            }
        }
    `;
  }
}
