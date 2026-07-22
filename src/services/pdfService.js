import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndSharePDF(
  imageUri,
  extractedText,
  aiSummary
) {
  // Enhanced HTML styling with modern CSS cards matching the Optix theme
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 20mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #060B1A;
            margin: 0;
            padding: 0;
            background-color: #FAFAFB;
          }
          .header {
            border-bottom: 3px solid #D97757;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 28px;
            font-weight: 700;
            color: #2B2457;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #9AA4BF;
            margin-top: 4px;
            margin-bottom: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .card {
            background: #ffffff;
            border: 1px solid #E4E7EC;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #2B2457;
            margin-top: 0;
            margin-bottom: 12px;
            border-bottom: 1px solid #E4E7EC;
            padding-bottom: 6px;
          }
          .content-text {
            font-size: 14px;
            line-height: 1.6;
            color: #333C4E;
            white-space: pre-wrap;
            margin: 0;
          }
        </style>
      </head>
      <body>

        <div class="header">
          <h1 class="title">Optix Scan Report</h1>
          <p class="subtitle">AI Document Analysis Engine</p>
        </div>

        <div class="card">
          <h2 class="card-title">📝 Extracted Document Text</h2>
          <p class="content-text">${extractedText ? extractedText.trim() : "No text extracted from document."}</p>
        </div>

        <div class="card">
          <h2 class="card-title">✨ AI Analysis Insights</h2>
          <p class="content-text">${aiSummary ? aiSummary.trim() : "No AI analysis summary provided."}</p>
        </div>

      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Optix Scan Report',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.log("PDF GENERATION ERROR:", error);
    throw error;
  }
}