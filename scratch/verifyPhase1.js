const db = require('../src/db');
const { handleIncomingMessage } = require('../src/onboardingLogic');
const { getUserMatches } = require('../src/matchingEngine');

require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async (to, text) => { console.log(`[OUTBOUND TEXT to ${to}]: ${text.substring(0, 100)}...`); return { success: true }; },
    sendButtons: async (to, text, buttons) => { console.log(`[OUTBOUND BUTTONS to ${to}]: ${text.substring(0, 100)}... [${buttons.map(b => b.id).join('|')}]`); return { success: true }; },
    sendList: async (to, header, text, footer, sections) => { console.log(`[OUTBOUND LIST to ${to}]: ${text.substring(0, 100)}...`); return { success: true }; }
  }
};

const onboardingLogic = require('../src/onboardingLogic');

async function test(wa_id, lang) {
  console.log(`\n--- VERIFYING PHASE 1 (${lang.toUpperCase()}) ---`);
  
  const user = db.prepare('SELECT id FROM users WHERE wa_id = ?').get(wa_id);
  if (!user) {
    console.log('❌ USER NOT FOUND');
    process.exit(1);
  }
  const userId = user.id;

  // 1. Check Dashboard (Frame 11) for Suo
  console.log('[TEST]: Checking Dashboard Badge...');
  const matchesText = await getUserMatches(userId, lang); 
  console.log(`Matches Output:\n${matchesText}`);

  if (matchesText.includes('Match') || matchesText.includes('मैच')) {
    console.log(`✅ ${lang.toUpperCase()} MATCH DISPLAY: SUCCESS`);
  } else {
    console.log(`❌ ${lang.toUpperCase()} MATCH DISPLAY: FAILED`);
    process.exit(1);
  }

  if (lang === 'en') {
    console.log('\n[TEST]: Breaking matches via district change...');
    db.prepare("UPDATE users SET cur_district = 'Lucknow' WHERE wa_id = ?").run(wa_id);
    const brokenMatches = await getUserMatches(userId, 'en');
    console.log(`Broken matches output: ${brokenMatches}`);
    if (brokenMatches.includes('No mutual matches')) {
      console.log('✅ DYNAMIC VALIDATION: SUCCESS');
    } else {
      console.log('❌ DYNAMIC VALIDATION: FAILED');
      process.exit(1);
    }
  }
}

async function main() {
  require('../src/forceSeedV2'); // Run seed
  await test('919999999999', 'en');
  await test('919999999999', 'hi');
  console.log('\n✨✨ PHASE 1 FINAL VERIFICATION PASSED! ✨✨');
}

main();
