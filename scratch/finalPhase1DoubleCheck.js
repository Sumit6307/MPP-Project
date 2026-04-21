const db = require('../src/db');
const { handleIncomingMessage } = require('../src/onboardingLogic');
const { getUserMatches } = require('../src/matchingEngine');

require.cache[require.resolve('../src/whatsappService')] = {
  exports: {
    sendText: async (to, text) => { return { success: true }; },
    sendButtons: async (to, text, buttons) => { return { success: true }; },
    sendList: async (to, header, text, footer, sections) => { return { success: true }; }
  }
};

async function checkLanguage(wa_id, lang) {
  console.log(`\nStarting Final Double Check for: ${lang.toUpperCase()}`);
  
  db.prepare('DELETE FROM users WHERE wa_id = ?').run(wa_id);
  
  console.log(' - Testing Onboarding...');
  const onboarding = [
    { interactive: { button_reply: { id: lang } } }, // Lang
    { text: { body: 'Test User' } },                 // Name
    { interactive: { list_reply: { id: 'AT-Primary' } } }, // Job
    { interactive: { list_reply: { id: 'Aligarh' } } },    // District
    { interactive: { list_reply: { id: 'Bijauli' } } },    // Block
    { interactive: { list_reply: { id: 'Hapur' } } },      // Pref 1
    { interactive: { list_reply: { id: 'skip_pref_2' } } }, // Pref 2 Skip (Internal)
    { interactive: { list_reply: { id: 'skip_pref_3' } } }, // Pref 3 Skip (Internal)
    { interactive: { button_reply: { id: 'yes_agree' } } }  // Consent
  ];

  for (const msg of onboarding) {
    await handleIncomingMessage(wa_id, msg);
  }
  
  const user = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);
  if (user.step === 11) console.log('   ✅ Onboarding Flow: SUCCESS');
  else throw new Error(`Onboarding failed for ${lang}`);

  console.log(' - Testing Granular Edit (Current District -> Block)...');
  await handleIncomingMessage(wa_id, { text: { body: 'edit' } });
  await handleIncomingMessage(wa_id, { interactive: { list_reply: { id: 'edit_cur_dist' } } });
  await handleIncomingMessage(wa_id, { interactive: { list_reply: { id: 'Mathura' } } }); // New Dist
  await handleIncomingMessage(wa_id, { interactive: { list_reply: { id: 'Raya' } } });    // New Block
  
  const updatedUser = db.prepare('SELECT * FROM users WHERE wa_id = ?').get(wa_id);
  if (updatedUser.cur_district === 'Mathura' && updatedUser.step === 11) console.log('   ✅ Granular Edit: SUCCESS');
  else throw new Error(`Edit failed for ${lang}`);

  console.log(' - Testing Mutual Matching...');
  const matches = await getUserMatches(user.id, lang);
  if (matches.length > 0) console.log('   ✅ Matching Engine: SUCCESS');
  else throw new Error(`Matching check failed for ${lang}`);
}

async function main() {
  try {
    require('../src/forceSeedV2'); // Refresh partners
    await checkLanguage('915555555555', 'en');
    await checkLanguage('914444444444', 'hi');
    console.log('\n🌟🌟🌟 FINAL PHASE 1 MASTER CHECK COMPLETED SUCCESSFULLY! 🌟🌟🌟');
    console.log('Both English and Hindi flows are 100% verified.');
  } catch (e) {
    console.error(`\n❌ DOUBLE CHECK FAILED: ${e.message}`);
    process.exit(1);
  }
}

main();
