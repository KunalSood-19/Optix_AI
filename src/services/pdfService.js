import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndSharePDF(
  imageUri,
  extractedText,
  aiSummary
) {
  const html = `
    <html>
      <body style="font-family: Arial; padding:20px;">

        <h1>Optix Scan Report</h1>

        <h2>Extracted Text</h2>

        <p>${extractedText.replace(/\n/g, '<br/>')}</p>

        <hr/>

        <h2>AI Analysis</h2>

        <p>${aiSummary.replace(/\n/g, '<br/>')}</p>

      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
  });

  await Sharing.shareAsync(uri);
}