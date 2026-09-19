/**
 * Free Autonomous Tools for James AI Community Agent
 * All tools are 100% free and require zero paid API keys.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class FreeToolsService {
  constructor(uploadsDir) {
    this.uploadsDir = uploadsDir || path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
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
   * 4. Free Weather API via Open-Meteo (100% Free, No Key)
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

      // 2. Fetch current weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
        { signal: AbortSignal.timeout(6000) }
      );
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      return {
        success: true,
        location: `${place.name}, ${place.country || ''}`,
        temperature: `${current.temperature_2m}°C`,
        humidity: `${current.relative_humidity_2m}%`,
        windSpeed: `${current.wind_speed_10m} km/h`
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
}

module.exports = { FreeToolsService };
