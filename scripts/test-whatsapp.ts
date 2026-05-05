// This script tests the WhatsApp service
// Run with: bun run scripts/test-whatsapp.ts (from inside server directory)
// Or: bun run server/scripts/test-whatsapp.ts (from root)

import { config } from 'dotenv';
import { join } from 'path';
import { sendVerificationWhatsApp } from '../utils/whatsapp.service.js';

// Load .env from current directory or parent
config({ path: join(process.cwd(), '.env') });

const TEST_PHONE = '201018939831'; // From the user's screenshot
const TEST_CODE = '123456';

async function testSendMessage() {
  console.log('--- WhatsApp Test ---');
  console.log(`Target Phone: ${TEST_PHONE}`);
  console.log('Sending message...');

  try {
    const result = await sendVerificationWhatsApp(TEST_PHONE, TEST_CODE);
    
    if (result) {
      console.log('✅ Success! WhatsApp message sent.');
      console.log('API Response:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Failed to send WhatsApp message.');
      console.log('Please check your WASEL_API_TOKEN and WASEL_INSTANCE_ID in .env');
    }
  } catch (error) {
    console.error('❌ An error occurred:');
    console.error(error);
  }
}

testSendMessage();
