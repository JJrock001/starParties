const cron     = require('node-cron');
const Settings = require('./models/Settings');

// ─── Week helpers ────────────────────────────────────────────────────────────

// Returns weekId (e.g. "2026-W25") for the week that starts on the NEXT Monday
// from now (Bangkok time, UTC+7).
const getNextWeekId = () => {
  // Work in UTC; Bangkok = UTC+7
  const nowUtc     = new Date();
  const bkkMs      = nowUtc.getTime() + 7 * 60 * 60 * 1000;
  const bkk        = new Date(bkkMs);
  const dow        = bkk.getUTCDay();                      // 0=Sun … 6=Sat
  const daysToMon  = dow === 0 ? 1 : 8 - dow;             // days until next Monday

  const nextMon    = new Date(bkk);
  nextMon.setUTCDate(bkk.getUTCDate() + daysToMon);

  const y    = nextMon.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const d4   = jan4.getUTCDay();
  const w1Mon = new Date(jan4);
  w1Mon.setUTCDate(4 + (1 - d4 + 7) % 7);

  const weekNo = Math.ceil((nextMon - w1Mon) / (7 * 24 * 3600_000)) + 1;
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
};

// ─── Scheduled jobs ──────────────────────────────────────────────────────────

// Sunday 18:00 BKK → open NEXT week in Launch mode
const openNextWeek = async () => {
  try {
    let s = await Settings.findOne({ key: 'booking' });
    if (!s) s = new Settings({ key: 'booking', value: {} });

    const nextWeekId = getNextWeekId();
    s.value = { weekId: nextWeekId, mode: 'launch' };
    s.markModified('value');
    await s.save();

    console.log(`[scheduler] ✅ Opened ${nextWeekId} — Launch mode (Sun 18:00 BKK)`);
  } catch (err) {
    console.error('[scheduler] ❌ openNextWeek:', err.message);
  }
};

// Sunday 23:59 BKK → switch to Free Buffet mode (keep same weekId)
const openFreeBuffet = async () => {
  try {
    const s = await Settings.findOne({ key: 'booking' });
    if (!s) return;

    s.value = { ...s.value, mode: 'buffet' };
    s.markModified('value');
    await s.save();

    console.log(`[scheduler] ✅ Switched to Free Buffet mode (Sun 23:59 BKK)`);
  } catch (err) {
    console.error('[scheduler] ❌ openFreeBuffet:', err.message);
  }
};

// ─── Register crons ──────────────────────────────────────────────────────────
// node-cron uses the server's local timezone by default.
// We pass timezone:'Asia/Bangkok' explicitly so it always fires at the right time
// regardless of where the server is hosted.

const start = () => {
  // Every Sunday at 18:00 Bangkok time
  cron.schedule('0 18 * * 0', openNextWeek, { timezone: 'Asia/Bangkok' });

  // Every Sunday at 23:59 Bangkok time
  cron.schedule('59 23 * * 0', openFreeBuffet, { timezone: 'Asia/Bangkok' });

  console.log('[scheduler] Cron jobs registered:');
  console.log('  • Sun 18:00 BKK → open next week (Launch mode)');
  console.log('  • Sun 23:59 BKK → switch to Free Buffet mode');
};

module.exports = { start, openNextWeek, openFreeBuffet };
