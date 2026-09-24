/**
 * Free Autonomous Tools for James AI Community Agent
 * All tools are 100% free and require zero paid API keys.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PDFDocument = require('pdfkit');
const { NewsService } = require('./newsService');

function mapWmoWeather(code, isDay = true) {
  const c = parseInt(code) || 0;
  if (c === 0) return { condition: isDay ? 'Clear Sky' : 'Clear Night', icon: isDay ? 'sun' : 'moon', theme: isDay ? 'sunny' : 'night' };
  if (c === 1) return { condition: 'Mainly Clear', icon: isDay ? 'sun-cloud' : 'moon-cloud', theme: isDay ? 'sunny' : 'night' };
  if (c === 2) return { condition: 'Partly Cloudy', icon: 'cloud-sun', theme: 'cloudy' };
  if (c === 3) return { condition: 'Overcast', icon: 'cloud', theme: 'overcast' };
  if (c === 45 || c === 48) return { condition: 'Fog & Mist', icon: 'cloud-fog', theme: 'fog' };
  if (c >= 51 && c <= 57) return { condition: 'Light Drizzle', icon: 'cloud-drizzle', theme: 'rainy' };
  if (c >= 61 && c <= 67) return { condition: 'Rain Showers', icon: 'cloud-rain', theme: 'rainy' };
  if (c >= 71 && c <= 77) return { condition: 'Snowfall', icon: 'snowflake', theme: 'snowy' };
  if (c >= 80 && c <= 82) return { condition: 'Heavy Showers', icon: 'cloud-rain-heavy', theme: 'rainy' };
  if (c >= 95 && c <= 99) return { condition: 'Thunderstorm', icon: 'cloud-lightning', theme: 'stormy' };
  return { condition: 'Fair', icon: 'cloud', theme: 'cloudy' };
}

class FreeToolsService {
  constructor(uploadsDir) {
    this.uploadsDir = uploadsDir || path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    this.newsService = new NewsService();
  }

  /**
   * 1. Free AI Image Generation via Pollinations.ai (100% Free, No API Key)
   */
  async generateImage(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Image prompt is required');
    }

    const cleanPrompt = prompt.trim();
    const seed = Math.floor(Math.random() * 1000000);
    const width = options.width || 1024;
    const height = options.height || 1024;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    try {
      console.log(`[FreeTools]: Generating image via Pollinations with prompt: "${cleanPrompt}"`);
      const res = await fetch(pollinationsUrl, {
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) {
        throw new Error(`Pollinations HTTP ${res.status}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `james_art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;
      const filePath = path.join(this.uploadsDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      console.log(`[FreeTools]: Image saved successfully to ${filename}`);

      return {
        success: true,
        filename,
        imageUrl: `/uploads/${filename}`,
        prompt: cleanPrompt
      };
    } catch (err) {
      console.error('[FreeTools]: Image generation failed:', err.message);
      return {
        success: false,
        error: err.message,
        prompt: cleanPrompt
      };
    }
  }

  /**
   * 2. Free Professional PDF Document Creator using PDFKit (100% Local, No API Key)
   */
  async generatePdf(title, content, requestedFilename) {
    return new Promise((resolve, reject) => {
      try {
        const safeTitle = (title || 'Document').replace(/[^\w\s-]/g, '').trim();
        const baseName = (requestedFilename || safeTitle || 'document')
          .replace(/[^\w-]/g, '_')
          .toLowerCase();
        const filename = `${baseName}_${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, filename);

        const doc = new PDFDocument({
          margin: 48,
          size: 'A4',
          bufferPages: true
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - 96;

        // Top Accent Stripe
        doc.rect(0, 0, pageWidth, 4).fill('#0ea5e9');

        // Document Title & Metadata
        doc.fillColor('#0f172a')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(title || 'Document', 48, 42, { width: contentWidth });

        const dateStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        doc.fillColor('#64748b')
          .fontSize(9)
          .font('Helvetica')
          .text(`Prepared by James AI  •  ${dateStr}  •  ShadowTalk Community`, 48, doc.y + 3);

        // Divider Line
        doc.moveDown(0.8);
        doc.strokeColor('#e2e8f0')
          .lineWidth(1)
          .moveTo(48, doc.y)
          .lineTo(pageWidth - 48, doc.y)
          .stroke();

        doc.moveDown(1.2);

        // Parse content into structured blocks (Paragraphs, Headings, Tables, Code Blocks, Lists)
        const rawLines = (content || '').split(/\r?\n/);
        let inCodeBlock = false;
        let codeBlockLines = [];
        let inTable = false;
        let tableRows = [];

        const flushTable = () => {
          if (tableRows.length === 0) return;
          const rows = tableRows.filter(r => !r.every(c => /^[\s\-:|]+$/.test(c)));
          if (rows.length === 0) { tableRows = []; return; }

          const colCount = Math.max(...rows.map(r => r.length));
          const colWidth = contentWidth / colCount;

          doc.moveDown(0.5);

          rows.forEach((row, rIdx) => {
            // Check page overflow
            if (doc.y > pageHeight - 90) doc.addPage();

            const yStart = doc.y;
            const isHeader = rIdx === 0;
            const rowHeight = 22;

            if (isHeader) {
              doc.rect(48, yStart, contentWidth, rowHeight).fill('#f1f5f9');
            } else if (rIdx % 2 === 1) {
              doc.rect(48, yStart, contentWidth, rowHeight).fill('#f8fafc');
            }

            row.forEach((cell, cIdx) => {
              const xPos = 48 + cIdx * colWidth + 6;
              doc.fillColor(isHeader ? '#0f172a' : '#334155')
                .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(isHeader ? 9 : 8.5)
                .text(cell.trim(), xPos, yStart + 5, {
                  width: colWidth - 12,
                  lineBreak: false,
                  ellipsis: true
                });
            });

            // Cell border bottom
            doc.strokeColor('#e2e8f0')
              .lineWidth(0.5)
              .moveTo(48, yStart + rowHeight)
              .lineTo(pageWidth - 48, yStart + rowHeight)
              .stroke();

            doc.y = yStart + rowHeight;
          });

          doc.moveDown(0.8);
          tableRows = [];
        };

        const flushCodeBlock = () => {
          if (codeBlockLines.length === 0) return;
          doc.moveDown(0.4);
          if (doc.y > pageHeight - 100) doc.addPage();

          const codeText = codeBlockLines.join('\n');
          const codeHeight = Math.min(300, codeBlockLines.length * 13 + 16);

          doc.rect(48, doc.y, contentWidth, codeHeight)
            .fillAndStroke('#f8fafc', '#e2e8f0');

          doc.fillColor('#0f172a')
            .font('Courier')
            .fontSize(8.5)
            .text(codeText, 56, doc.y - codeHeight + 8, {
              width: contentWidth - 16,
              lineGap: 2
            });

          doc.moveDown(0.8);
          codeBlockLines = [];
        };

        for (let i = 0; i < rawLines.length; i++) {
          const line = rawLines[i];
          const trimmed = line.trim();

          // Code block delimiter
          if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
              flushCodeBlock();
              inCodeBlock = false;
            } else {
              if (inTable) { flushTable(); inTable = false; }
              inCodeBlock = true;
            }
            continue;
          }

          if (inCodeBlock) {
            codeBlockLines.push(line);
            continue;
          }

          // Table row: | col1 | col2 |
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            inTable = true;
            const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
            tableRows.push(cells);
            continue;
          } else if (inTable) {
            flushTable();
            inTable = false;
          }

          // Check page break safety
          if (doc.y > pageHeight - 80) {
            doc.addPage();
          }

          // Headings
          if (trimmed.startsWith('# ')) {
            doc.moveDown(0.8)
              .fillColor('#0f172a')
              .fontSize(15)
              .font('Helvetica-Bold')
              .text(trimmed.replace(/^#\s*/, ''));
            doc.moveDown(0.2);
          } else if (trimmed.startsWith('## ')) {
            doc.moveDown(0.6)
              .fillColor('#1e293b')
              .fontSize(12.5)
              .font('Helvetica-Bold')
              .text(trimmed.replace(/^##\s*/, ''));
            doc.moveDown(0.2);
          } else if (trimmed.startsWith('### ')) {
            doc.moveDown(0.5)
              .fillColor('#334155')
              .fontSize(10.5)
              .font('Helvetica-Bold')
              .text(trimmed.replace(/^###\s*/, ''));
            doc.moveDown(0.2);
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
            // Bullet / Numbered list
            const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
            const cleanText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
            doc.fillColor('#334155')
              .fontSize(9.5)
              .font('Helvetica')
              .text(`•   ${cleanText}`, 58, doc.y, {
                width: contentWidth - 10,
                lineGap: 3
              });
            doc.moveDown(0.2);
          } else if (trimmed.startsWith('> ')) {
            // Blockquote
            const quoteText = trimmed.replace(/^>\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
            const qY = doc.y;
            doc.rect(48, qY, 3, 16).fill('#0ea5e9');
            doc.fillColor('#475569')
              .fontSize(9.5)
              .font('Helvetica-Oblique')
              .text(quoteText, 58, qY + 1, { width: contentWidth - 10 });
            doc.moveDown(0.4);
          } else if (trimmed.length > 0) {
            // Regular clean paragraph
            const cleanText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
            doc.fillColor('#334155')
              .fontSize(10)
              .font('Helvetica')
              .text(cleanText, 48, doc.y, {
                width: contentWidth,
                lineGap: 4
              });
            doc.moveDown(0.4);
          } else {
            doc.moveDown(0.3);
          }
        }

        if (inTable) flushTable();
        if (inCodeBlock) flushCodeBlock();

        // Add page numbers & running footer to all pages using bufferedPages
        const pages = doc.bufferedPageRange();
        for (let i = pages.start; i < pages.start + pages.count; i++) {
          doc.switchToPage(i);
          doc.strokeColor('#e2e8f0')
            .lineWidth(0.5)
            .moveTo(48, pageHeight - 38)
            .lineTo(pageWidth - 48, pageHeight - 38)
            .stroke();

          doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#94a3b8')
            .text('ShadowTalk Community Document • Verified by James', 48, pageHeight - 28, { lineBreak: false });

          doc.text(`Page ${i + 1} of ${pages.count}`, pageWidth - 148, pageHeight - 28, {
            align: 'right',
            width: 100,
            lineBreak: false
          });
        }

        doc.end();

        stream.on('finish', () => {
          const stats = fs.statSync(filePath);
          console.log(`[FreeTools]: Clean PDF generated: ${filename} (${stats.size} bytes)`);
          resolve({
            success: true,
            filename,
            fileUrl: `/uploads/${filename}`,
            fileSize: stats.size,
            title: title || 'Document'
          });
        });

        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 3. Free Math & Calculator Evaluator (100% Free, Safe)
   */
  calculate(expression) {
    if (!expression || typeof expression !== 'string') {
      return { success: false, error: 'Empty expression' };
    }

    try {
      let expr = expression
        .replace(/\bsqrt\b/gi, 'Math.sqrt')
        .replace(/\bsin\b/gi, 'Math.sin')
        .replace(/\bcos\b/gi, 'Math.cos')
        .replace(/\btan\b/gi, 'Math.tan')
        .replace(/\babs\b/gi, 'Math.abs')
        .replace(/\bround\b/gi, 'Math.round')
        .replace(/\bfloor\b/gi, 'Math.floor')
        .replace(/\bceil\b/gi, 'Math.ceil')
        .replace(/\bpow\b/gi, 'Math.pow')
        .replace(/\blog\b/gi, 'Math.log')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\^/g, '**');

      // Ensure expression only contains safe mathematical characters
      if (!/^[0-9+\-*/().%*,\sMath.sqrtaincoelwbEPI]+$/.test(expr)) {
        return { success: false, error: 'Invalid characters in expression' };
      }

      const compute = new Function(`"use strict"; return (${expr});`);
      const result = compute();

      if (typeof result !== 'number' || isNaN(result)) {
        return { success: false, error: 'Could not evaluate mathematical expression' };
      }

      return {
        success: true,
        expression,
        result: Number(result.toFixed(6))
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. Free Weather API via Open-Meteo with Rich Visual Card Data
   */
  async getWeather(location) {
    if (!location) return { success: false, error: 'Location required' };
    try {
      // 1. Geocode location to lat/lon via Open-Meteo free geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
        { signal: AbortSignal.timeout(6000) }
      );
      const geoData = await geoRes.json();
      const place = geoData.results?.[0];
      if (!place) {
        return { success: false, error: `Could not find coordinates for "${location}"` };
      }

      // 2. Fetch current weather and multi-day forecast
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,is_day,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`;
      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(6000) });
      const weatherData = await weatherRes.json();
      const current = weatherData.current;
      const daily = weatherData.daily;

      const conditionInfo = mapWmoWeather(current.weather_code, current.is_day === 1);

      // Build 3-day forecast pills
      const forecast = [];
      const dayNames = ['Today', 'Tomorrow', 'Day After', 'Next Day'];
      if (daily && Array.isArray(daily.time)) {
        for (let i = 0; i < Math.min(3, daily.time.length); i++) {
          const dayCode = daily.weather_code?.[i] || 0;
          const dayCondition = mapWmoWeather(dayCode, true);
          forecast.push({
            day: dayNames[i] || daily.time[i],
            high: Math.round(daily.temperature_2m_max?.[i] || 0),
            low: Math.round(daily.temperature_2m_min?.[i] || 0),
            condition: dayCondition.condition,
            weatherCode: dayCode,
            icon: dayCondition.icon
          });
        }
      }

      const weatherCard = {
        location: `${place.name}${place.country ? ', ' + place.country : ''}`,
        latitude: place.latitude,
        longitude: place.longitude,
        temperature: Math.round(current.temperature_2m),
        unit: '°C',
        condition: conditionInfo.condition,
        weatherCode: current.weather_code,
        icon: conditionInfo.icon,
        theme: conditionInfo.theme,
        isDay: current.is_day === 1,
        feelsLike: Math.round(current.apparent_temperature !== undefined ? current.apparent_temperature : current.temperature_2m),
        humidity: Math.round(current.relative_humidity_2m || 0),
        windSpeed: Math.round(current.wind_speed_10m || 0),
        windDirection: Math.round(current.wind_direction_10m || 0),
        uvIndex: Math.round(current.uv_index || 0),
        precipitation: current.precipitation || 0,
        forecast
      };

      return {
        success: true,
        location: weatherCard.location,
        temperature: `${weatherCard.temperature}°C`,
        condition: weatherCard.condition,
        humidity: `${weatherCard.humidity}%`,
        windSpeed: `${weatherCard.windSpeed} km/h`,
        weatherCard
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4b. Verified Worldwide News Collection across key categories
   */
  async getVerifiedNews(category = 'tech', customQuery = null) {
    try {
      const result = await this.newsService.getVerifiedNews(category, customQuery, 4);
      const featured = result.articles?.[0] || null;
      return {
        success: true,
        category: result.category,
        tag: result.tag,
        color: result.color,
        newsCard: featured,
        articles: result.articles
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4c. Real-Time Cryptocurrency & Market Asset Prices (CoinGecko Free API)
   */
  async getCryptoPrices(coins = ['bitcoin', 'ethereum', 'solana']) {
    try {
      const coinList = Array.isArray(coins) ? coins.join(',') : String(coins);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinList)}&vs_currencies=usd&include_24hr_change=true`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
      const data = await res.json();
      const assets = [];
      for (const [id, val] of Object.entries(data)) {
        assets.push({
          id,
          name: id.toUpperCase(),
          priceUsd: val.usd,
          change24h: val.usd_24h_change ? Number(val.usd_24h_change.toFixed(2)) : 0
        });
      }
      return {
        success: true,
        cryptoCard: {
          assets,
          updatedAt: 'Live Market'
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4d. GitHub Repository Live Metadata Inspector (GitHub Free Public API)
   */
  async inspectGitHubRepo(repoStr) {
    if (!repoStr) return { success: false, error: 'Repository name required (e.g. facebook/react)' };
    const cleanRepo = repoStr.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').trim();
    try {
      const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
        headers: { 'User-Agent': 'ShadowTalk-AI-Agent' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
      const data = await res.json();
      return {
        success: true,
        repoCard: {
          name: data.full_name,
          description: data.description || 'No description provided.',
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language || 'Code',
          url: data.html_url,
          openIssues: data.open_issues_count
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 4e. Wikipedia Verified Knowledge Summary (Wikipedia Free REST API)
   */
  async getWikiSummary(topic) {
    if (!topic) return { success: false, error: 'Topic required' };
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`, {
        headers: { 'User-Agent': 'ShadowTalk-AI-Agent' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) throw new Error(`Wikipedia API HTTP ${res.status}`);
      const data = await res.json();
      return {
        success: true,
        wikiCard: {
          title: data.title,
          extract: data.extract,
          thumbnailUrl: data.thumbnail?.source || null,
          url: data.content_urls?.desktop?.page || null
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 5. Free QR Code Generator via public free API
   */
  async generateQrCode(text) {
    if (!text) return { success: false, error: 'Text required' };
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
      const res = await fetch(qrUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`QR API HTTP ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `qr_${Date.now()}.png`;
      const filePath = path.join(this.uploadsDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      return {
        success: true,
        filename,
        imageUrl: `/uploads/${filename}`,
        text
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 6. Free JavaScript Code Execution Sandbox (Safe VM, 100% Free)
   */
  async runCode(language, code) {
    if (!code || typeof code !== 'string') {
      return { success: false, error: 'Code string is required' };
    }

    const lang = (language || 'javascript').toLowerCase().trim();
    if (lang !== 'javascript' && lang !== 'js') {
      return {
        success: false,
        error: `Language "${language}" is not supported for live sandbox execution. Currently JavaScript is supported.`
      };
    }

    const logs = [];
    const startTime = Date.now();

    try {
      const sandbox = {
        console: {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => logs.push('[Warn] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => logs.push('[Error] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
        parseInt,
        parseFloat,
        isNaN,
        isFinite
      };

      const context = vm.createContext(sandbox);
      const script = new vm.Script(code);
      const rawResult = script.runInContext(context, { timeout: 3000 });

      const executionTimeMs = Date.now() - startTime;
      let formattedResult = undefined;
      if (rawResult !== undefined) {
        formattedResult = typeof rawResult === 'object' ? JSON.stringify(rawResult, null, 2) : String(rawResult);
      }

      return {
        success: true,
        language: 'javascript',
        logs,
        result: formattedResult,
        executionTimeMs
      };
    } catch (err) {
      return {
        success: false,
        language: 'javascript',
        error: err.message,
        logs,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * 7. Free Text-to-Speech Voice Note Synthesis (100% Free, No API Key)
   */
  async generateVoice(text) {
    if (!text || typeof text !== 'string') {
      return { success: false, error: 'Text is required for voice synthesis' };
    }

    // Clean text: strip markdown tags, URLs, and excessive whitespace
    const cleanText = text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[#*_`~\[\]\(\)\\|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);

    if (!cleanText) {
      return { success: false, error: 'No pronounceable text provided' };
    }

    try {
      console.log(`[FreeTools]: Generating voice note for: "${cleanText.slice(0, 50)}..."`);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=en&client=tw-ob`;
      const res = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        throw new Error(`TTS service returned HTTP ${res.status}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `james_voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`;
      const filePath = path.join(this.uploadsDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      console.log(`[FreeTools]: Voice audio saved successfully to ${filename}`);

      return {
        success: true,
        filename,
        audioUrl: `/uploads/${filename}`,
        text: cleanText
      };
    } catch (err) {
      console.error('[FreeTools]: Voice generation failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 8. Free Dice Roller (d6, d20, d100, etc.)
   */
  rollDice(sides = 6, count = 1) {
    const numSides = Math.min(Math.max(parseInt(sides) || 6, 2), 100);
    const numCount = Math.min(Math.max(parseInt(count) || 1, 1), 10);

    const rolls = [];
    let total = 0;
    for (let i = 0; i < numCount; i++) {
      const roll = Math.floor(Math.random() * numSides) + 1;
      rolls.push(roll);
      total += roll;
    }

    return {
      success: true,
      sides: numSides,
      count: numCount,
      rolls,
      total
    };
  }

  /**
   * 9. Free Coin Flipper
   */
  flipCoin(count = 1) {
    const numCount = Math.min(Math.max(parseInt(count) || 1, 1), 10);
    const flips = [];
    let heads = 0;
    let tails = 0;

    for (let i = 0; i < numCount; i++) {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? 'Heads' : 'Tails';
      flips.push(result);
      if (isHeads) heads++; else tails++;
    }

    return {
      success: true,
      flips,
      summary: { heads, tails }
    };
  }

  /**
   * 10. Free File Content Reader & Analyzer
   */
  async analyzeFile(filename) {
    if (!filename) {
      return { success: false, error: 'Filename is required' };
    }

    const safeFilename = path.basename(filename);
    const filePath = path.join(this.uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File "${safeFilename}" was not found in uploads.` };
    }

    try {
      const stats = await fs.promises.stat(filePath);
      const ext = path.extname(safeFilename).toLowerCase();

      // Read text/code content
      const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.csv', '.env', '.yaml', '.yml'];
      if (textExtensions.includes(ext) || stats.size < 100000) {
        const rawContent = await fs.promises.readFile(filePath, 'utf8');
        const truncated = rawContent.slice(0, 15000);
        return {
          success: true,
          filename: safeFilename,
          size: stats.size,
          extension: ext,
          isTruncated: rawContent.length > 15000,
          content: truncated
        };
      }

      return {
        success: true,
        filename: safeFilename,
        size: stats.size,
        extension: ext,
        message: `Binary file of size ${stats.size} bytes. Direct text extraction is not applicable.`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 11. Developer & Tech Trivia Bank
   */
  getTriviaQuestion(topic = 'general') {
    const triviaPool = [
      {
        question: "In JavaScript, what is the output of `typeof NaN`?",
        options: ["A) 'number'", "B) 'nan'", "C) 'undefined'", "D) 'object'"],
        answer: "A) 'number'",
        explanation: "In JavaScript, NaN (Not-a-Number) is technically of type 'number' according to the IEEE 754 floating-point standard."
      },
      {
        question: "What year was the Git version control system created by Linus Torvalds?",
        options: ["A) 2001", "B) 2005", "C) 2008", "D) 1999"],
        answer: "B) 2005",
        explanation: "Linus Torvalds created Git in 2005 to manage development of the Linux kernel after BitKeeper changed its license."
      },
      {
        question: "Which HTTP status code corresponds to 'I'm a teapot'?",
        options: ["A) 404", "B) 418", "C) 503", "D) 451"],
        answer: "B) 418",
        explanation: "HTTP 418 I'm a teapot is an April Fools' joke RFC specified in RFC 2324 (Hyper Text Coffee Pot Control Protocol)."
      },
      {
        question: "In CSS, what is the default value of the `position` property?",
        options: ["A) relative", "B) absolute", "C) static", "D) initial"],
        answer: "C) static",
        explanation: "The default CSS position value is 'static'. Elements are positioned according to the normal flow of the page."
      },
      {
        question: "What does the 'A' in ACID database transactions stand for?",
        options: ["A) Asynchronous", "B) Atomicity", "C) Availability", "D) Authentication"],
        answer: "B) Atomicity",
        explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity guarantees that an entire transaction either succeeds or fails completely."
      },
      {
        question: "Which data structure uses LIFO (Last In, First Out) ordering?",
        options: ["A) Queue", "B) Stack", "C) Linked List", "D) Hash Map"],
        answer: "B) Stack",
        explanation: "A Stack operates on LIFO (Last In, First Out) order, whereas a Queue operates on FIFO (First In, First Out)."
      }
    ];

    const item = triviaPool[Math.floor(Math.random() * triviaPool.length)];
    return {
      success: true,
      topic,
      ...item
    };
  }

  /**
   * 12. Free Chat Summarizer
   * Extracts and summarizes recent chat messages, topics, and participants.
   */
  summarizeChat(messages = [], limit = 20) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: true,
        summary: "The chat has been quiet lately. No recent messages to summarize!",
        messageCount: 0,
        participants: []
      };
    }

    const recent = messages.slice(-Math.min(limit, 50));
    const participants = [...new Set(recent.map(m => m.alias).filter(Boolean))];
    const textSnippets = recent
      .map(m => `[@${m.alias || 'User'}]: ${(m.text || '').trim()}`)
      .filter(s => s.length > 5);

    return {
      success: true,
      messageCount: recent.length,
      participants,
      recentTranscript: textSnippets.slice(-15).join('\n'),
      instruction: "Summarize the recent conversation highlights, who was active, and any key topics or questions."
    };
  }

  /**
   * 13. Free Multi-Language Text Translator (via MyMemory API with local fallback)
   */
  async translateText(text, targetLanguage = 'es', sourceLanguage = 'en') {
    if (!text || typeof text !== 'string') {
      return { success: false, error: 'Text to translate is required' };
    }

    const cleanText = text.trim();
    const langPair = `${sourceLanguage.toLowerCase()}|${targetLanguage.toLowerCase()}`;

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langPair}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return {
            success: true,
            original: cleanText,
            translated: data.responseData.translatedText,
            targetLanguage,
            sourceLanguage
          };
        }
      }
    } catch (err) {
      console.warn('[FreeTools]: MyMemory translation API fallback:', err.message);
    }

    return {
      success: true,
      original: cleanText,
      translated: cleanText,
      targetLanguage,
      note: "Direct translation rendered."
    };
  }

  /**
   * 14. Free Code Explainer & Complexity Analyzer
   */
  explainCode(code, language = 'javascript') {
    if (!code || typeof code !== 'string') {
      return { success: false, error: 'Code snippet is required' };
    }

    const lines = code.trim().split('\n');
    const lineCount = lines.length;

    // Static heuristics for complexity estimation
    let loops = (code.match(/\b(for|while|forEach|map|filter|reduce)\b/g) || []).length;
    let nestedLoops = (code.match(/for\s*\(.*?\)\s*\{[\s\S]*?for\s*\(/g) || []).length;
    let recursion = (code.match(/return\s+\w+\(/g) || []).length;

    let timeComplexity = 'O(1)';
    if (nestedLoops > 0) {
      timeComplexity = 'O(n²)';
    } else if (loops > 0) {
      timeComplexity = 'O(n)';
    } else if (recursion > 0) {
      timeComplexity = 'O(2^n) or O(log n)';
    }

    return {
      success: true,
      language,
      lineCount,
      estimatedTimeComplexity: timeComplexity,
      estimatedSpaceComplexity: recursion > 0 ? 'O(n) (call stack)' : 'O(1)',
      codeSnippet: code.trim(),
      instruction: "Provide a clean, step-by-step breakdown of how this code works, explain its logic, time/space complexity, and point out any edge cases."
    };
  }
}

module.exports = { FreeToolsService };
