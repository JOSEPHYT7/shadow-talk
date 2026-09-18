const assert = require('assert');
const { FreeToolsService } = require('./james/freeTools');

async function testFreeTools() {
  console.log('=== Testing James Free Autonomous Tools ===\n');
  const tools = new FreeToolsService();

  // Test 1: Math Calculator
  console.log('[Test 1]: Testing Free Math Calculator...');
  const calcRes = tools.calculate('sqrt(144) * 5 + 10 / 2');
  console.log('Calc result:', calcRes);
  assert(calcRes.success, 'Math should succeed');
  assert.strictEqual(calcRes.result, 65, 'sqrt(144)*5 + 5 should be 65');
  console.log('✓ Math calculator verified.\n');

  // Test 2: Free PDF Document Generation
  console.log('[Test 2]: Testing Free PDF Generator...');
  const pdfRes = await tools.generatePdf(
    'Prime Ministers of Selected Nations',
    `# Global Heads of Government
A curated reference list of selected Prime Ministers around the world.

| S.No | Name | Country | Party |
|---|---|---|---|
| 1 | Narendra Modi | India | Bharatiya Janata Party |
| 2 | Keir Starmer | United Kingdom | Labour Party |
| 3 | Anthony Albanese | Australia | Australian Labor Party |
| 4 | Justin Trudeau | Canada | Liberal Party |
| 5 | Fumio Kishida | Japan | Liberal Democratic Party |

## Summary Notes
- All documents generated natively by James AI in ShadowTalk.
- Formatted with custom cyber headers and verified community tags.`,
    'test_prime_ministers'
  );
  console.log('PDF result:', pdfRes);
  assert(pdfRes.success, 'PDF generation should succeed');
  assert(pdfRes.fileUrl.endsWith('.pdf'), 'Should output a .pdf URL');
  assert(pdfRes.fileSize > 1000, 'PDF file should have valid size');
  console.log('✓ PDF Generator verified.\n');

  // Test 3: Free QR Code Generator
  console.log('[Test 3]: Testing Free QR Code Generator...');
  const qrRes = await tools.generateQrCode('https://github.com');
  console.log('QR result:', qrRes);
  assert(qrRes.success, 'QR code should succeed');
  assert(qrRes.imageUrl.endsWith('.png'), 'Should output a .png URL');
  console.log('✓ QR Code generator verified.\n');

  // Test 4: Free Weather API
  console.log('[Test 4]: Testing Free Weather API (Open-Meteo)...');
  const weatherRes = await tools.getWeather('London');
  console.log('Weather result:', weatherRes);
  assert(weatherRes.success, 'Weather lookup should succeed');
  assert(weatherRes.temperature, 'Should include temperature');
  console.log('✓ Weather lookup verified.\n');

  // Test 5: Free AI Image Generator (Pollinations.ai)
  console.log('[Test 5]: Testing Free AI Image Generator...');
  const imgRes = await tools.generateImage('cyberpunk neon cat sitting on computer');
  console.log('Image result:', imgRes);
  assert(imgRes.success, 'Image generation should succeed');
  assert(imgRes.imageUrl.endsWith('.png'), 'Should output a .png image URL');
  console.log('✓ AI Image generator verified.\n');

  console.log('=== ALL FREE TOOLS VERIFIED SUCCESSFULLY! ===');
}

testFreeTools().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
