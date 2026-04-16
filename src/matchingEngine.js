const db = require('./db');
const { sendText } = require('./whatsappService');

async function checkMatches(userId) {
  const userA = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userA || !userA.consent) return;

  const userAPrefs = db.prepare('SELECT district_name FROM preferences WHERE user_id = ? ORDER BY priority').all(userId);
  
  
  for (const pref of userAPrefs) {
    const potentialMatches = db.prepare(`
      SELECT u.* FROM users u
      JOIN preferences p ON u.id = p.user_id
      WHERE u.cur_district = ? 
      AND p.district_name = ? 
      AND u.job_post = ?
      AND u.id != ?
      AND u.consent = 1
    `).all(pref.district_name, userA.cur_district, userA.job_post, userId);

    for (const userB of potentialMatches) {
      const existing = db.prepare('SELECT * FROM matches WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)')
        .get(userId, userB.id, userB.id, userId);
      
      if (!existing) {
        db.prepare('INSERT INTO matches (user_a_id, user_b_id) VALUES (?, ?)').run(userId, userB.id);
        
        await notifyMatch(userA, userB);
      }
    }
  }
}

async function notifyMatch(userA, userB) {
  const getMsg = (lang, partner) => {
    if (lang === 'hi') {
      return `🎉 *म्यूचुअल मैच मिल गया!*\n\nहमें आपके लिए एक पार्टनर मिला है:\n• नाम: ${partner.name}\n• जिला: ${partner.cur_district}\n• ब्लॉक: ${partner.cur_block}\n• फोन: ${partner.wa_id}\n\nअब आप उनसे सीधे संपर्क कर सकते हैं।`;
    }
    return `🎉 *Mutual Match Found!*\n\nWe found a swap partner for you:\n• Name: ${partner.name}\n• District: ${partner.cur_district}\n• Block: ${partner.cur_block}\n• Phone: ${partner.wa_id}\n\nYou can now contact them directly.`;
  };

  await sendText(userA.wa_id, getMsg(userA.language, userB));
  await sendText(userB.wa_id, getMsg(userB.language, userA));
}

module.exports = { checkMatches };
