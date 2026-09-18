/**
 * Web Research Service for James Agent
 * Provides live search and web page text extraction.
 */

class WebResearch {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  }

  /**
   * Search the web for fresh information.
   * Prioritizes configured API keys (Tavily/Serper/Brave) or falls back to DuckDuckGo without any API key required.
   * @param {string} query - The search query.
   * @param {number} maxResults - Max results to return.
   * @returns {Promise<Array<{ title: string, url: string, snippet: string }>>}
   */
  async search(query, maxResults = 5) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }
    const cleanQuery = query.trim();

    // 1. Tavily Search API if configured
    if (process.env.TAVILY_API_KEY) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: cleanQuery,
            search_depth: 'basic',
            max_results: maxResults
          }),
          signal: AbortSignal.timeout(7000)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            return data.results.slice(0, maxResults).map(r => ({
              title: r.title || 'Untitled',
              url: r.url || '',
              snippet: r.content || ''
            }));
          }
        }
      } catch (err) {
        console.warn('[WebResearch]: Tavily search error, falling back to DuckDuckGo:', err.message);
      }
    }

    // 2. Serper Search API if configured
    if (process.env.SERPER_API_KEY) {
      try {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: cleanQuery, num: maxResults }),
          signal: AbortSignal.timeout(7000)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.organic)) {
            return data.organic.slice(0, maxResults).map(r => ({
              title: r.title || 'Untitled',
              url: r.link || '',
              snippet: r.snippet || ''
            }));
          }
        }
      } catch (err) {
        console.warn('[WebResearch]: Serper search error:', err.message);
      }
    }

    // 3. DuckDuckGo Instant Answer / HTML Search (Default zero-key fallback)
    try {
      const results = await this.searchDuckDuckGo(cleanQuery, maxResults);
      if (results && results.length > 0) {
        return results;
      }
    } catch (err) {
      console.warn('[WebResearch]: DuckDuckGo search error:', err.message);
    }

    return [];
  }

  /**
   * Zero-key DuckDuckGo search fallback using HTML search
   */
  async searchDuckDuckGo(query, maxResults = 5) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!res.ok) {
      throw new Error(`DuckDuckGo returned status ${res.status}`);
    }

    const html = await res.text();
    const results = [];

    // Parse DuckDuckGo result blocks
    // Format: <a class="result__snippet" ...>...</a> and <a class="result__url" ...>
    const resultRegex = /<a[^>]*class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      let rawUrl = match[1];
      // DuckDuckGo redirects often look like //duckduckgo.com/l/?uddg=https%3A%2F%2F...
      if (rawUrl.includes('uddg=')) {
        const matchUddg = rawUrl.match(/uddg=([^&]+)/);
        if (matchUddg) {
          try {
            rawUrl = decodeURIComponent(matchUddg[1]);
          } catch (e) {}
        }
      } else if (rawUrl.startsWith('//')) {
        rawUrl = 'https:' + rawUrl;
      }

      const rawTitle = this.stripHtml(match[2]).trim();
      const rawSnippet = this.stripHtml(match[3]).trim();

      if (rawSnippet && rawUrl && !rawUrl.includes('duckduckgo.com')) {
        results.push({
          title: rawTitle || 'Search Result',
          url: rawUrl,
          snippet: rawSnippet
        });
      }
    }

    // Secondary fallback: Simple link & snippet extraction if the above regex is too strict
    if (results.length === 0) {
      const altSnippetRegex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      const altLinkRegex = /<a class="result__url"[^>]*href="([^"]+)"/gi;
      
      const snippets = [];
      const links = [];
      let sMatch;
      while ((sMatch = altSnippetRegex.exec(html)) !== null && snippets.length < maxResults) {
        snippets.push(this.stripHtml(sMatch[1]).trim());
      }
      let lMatch;
      while ((lMatch = altLinkRegex.exec(html)) !== null && links.length < maxResults) {
        let u = lMatch[1];
        if (u.includes('uddg=')) {
          const m = u.match(/uddg=([^&]+)/);
          if (m) {
            try { u = decodeURIComponent(m[1]); } catch (e) {}
          }
        }
        links.push(u);
      }

      for (let i = 0; i < Math.min(snippets.length, links.length); i++) {
        if (snippets[i] && links[i] && !links[i].includes('duckduckgo.com')) {
          results.push({
            title: 'Search Result',
            url: links[i],
            snippet: snippets[i]
          });
        }
      }
    }

    return results;
  }

  /**
   * Fetch a web page and return clean readable content.
   * @param {string} url - Target URL.
   * @param {number} maxChars - Maximum characters to return.
   * @returns {Promise<{ title: string, url: string, content: string, error?: string }>}
   */
  async fetchUrl(url, maxChars = 3000) {
    if (!url || !url.startsWith('http')) {
      return { title: '', url, content: '', error: 'Invalid or missing URL.' };
    }

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (!res.ok) {
        return { title: '', url, content: '', error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text') && !contentType.includes('html') && !contentType.includes('json')) {
        return { title: '', url, content: '', error: `Unsupported content type: ${contentType}` };
      }

      const text = await res.text();

      // Extract title
      const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? this.stripHtml(titleMatch[1]).trim() : '';

      // Strip non-content tags
      let clean = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ');

      clean = this.stripHtml(clean)
        .replace(/\s+/g, ' ')
        .trim();

      if (clean.length > maxChars) {
        clean = clean.substring(0, maxChars) + '... [Content truncated]';
      }

      return {
        title: title || 'Web Page',
        url,
        content: clean
      };
    } catch (err) {
      return {
        title: '',
        url,
        content: '',
        error: `Fetch failed: ${err.message}`
      };
    }
  }

  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ');
  }
}

module.exports = { WebResearch };
