const { handleIncomingMessage } = require('../src/onboardingLogic');
const db = require('../src/db');

// Mock WhatsApp Service to prevent real API calls during test
require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async (to, text) => { console.log(`[OUTBOUND TEXT to ${to}]: ${text.substring(0, 50)}...`); return { success: true }; },
    sendButtons: async (to, text, buttons) => { console.log(`[OUTBOUND BUTTONS to ${to}]: ${text.substring(0, 50)}... [${buttons.map(b => b.id).join('|')}]`); return { success: true }; },
    sendList: async (to, header, text, footer, sections) => { console.log(`[OUTBOUND LIST to ${to}]: ${text.substring(0, 50)}...`); return { success: true }; }
  }
};

async function runTest(wa_id, lang) {
  console.log(`\n--- TESTING ${lang.toUpperCase()} UNIFIED SKIP FLOW ---`);
  
  // Clean start & Registration
  db.prepare('DELETE FROM users WHERE wa_id = ?').run(wa_id);
  db.prepare('INSERT INTO users (wa_id, step) VALUES (?, 1)').run(wa_id);

  const registrationSteps = [
    { interactive: { button_reply: { id: lang } } }, // Step 1 -> 2
    { text: { body: 'Test User' } },                 // Step 2 -> 3
    { interactive: { list_reply: { id: 'AT-Primary' } } }, // Step 3 -> 4
    { interactive: { list_reply: { id: 'Aligarh' } } },    // Step 4 -> 5
    { interactive: { list_reply: { id: 'Khair' } } },      // Step 5 -> 7
    { interactive: { list_reply: { id: 'Hapur' } } },      // Step 7 -> 8
    { interactive: { list_reply: { id: 'skip_pref_2' } } }, // Step 8 -> 9 (NEW LIST-BASED SKIP)
    { interactive: { list_reply: { id: 'skip_pref_3' } } }, // Step 9 -> 10 (NEW LIST-BASED SKIP)
    { interactive: { button_reply: { id: 'yes_agree' } } },   // Step 10 -> 11 (Summary)
  ];

  for (const msg of registrationSteps) {
    await handleIncomingMessage(wa_id, msg);
  }

  let user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);
  if (user.step === 11) console.log('✅ Registration with Unified Skip: SUCCESS');
  else throw new Error(`Registration Failed: step=${user.step}`);

  // --- SUBTEST: Edit Pref 2 and Skip via List ---
  console.log(`\n[SUBTEST]: Edit Pref 2 (Skip via List)`);
  await handleIncomingMessage(wa_id, { text: { body: 'edit' } });
  await handleIncomingMessage(wa_id, { interactive: { list_reply: { id: 'edit_pref_2' } } });
  await handleIncomingMessage(wa_id, { interactive: { list_reply: { id: 'skip_pref_2' } } });
  user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);
  if (user.step === 11) console.log('✅ Edit Pref 2 Unified Skip: SUCCESS');
  else throw new Error(`Edit Pref 2 Skip Failed: step=${user.step}`);

  console.log(`\n✅ ${lang.toUpperCase()} UNIFIED SKIP FLOW VERIFIED!`);
}

async function main() {
  try {
    await runTest('914444444444', 'en');
    await runTest('913333333333', 'hi');
    console.log('\n✨✨ ALL UNIFIED SKIP TESTS PASSED! ✨✨');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

main();
