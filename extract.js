const fs = require('fs');

const transcriptPath = 'C:/Users/vedan/.gemini/antigravity-ide/brain/e765e80b-ec8c-4db1-940e-560f8e0ed48c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'write_to_file' || call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') {
          if (JSON.stringify(call.args).includes('Optix Assistant')) {
             console.log('FOUND IT AT STEP:', step.step_index);
             fs.writeFileSync('extracted_homescreen.txt', JSON.stringify(call.args, null, 2));
             process.exit(0);
          }
        }
      }
    }
  } catch (e) {}
}
console.log('Not found');
