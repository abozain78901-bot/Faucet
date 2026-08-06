/* ====================================================================
 *  MAIN CONFIGURATION FILE — every tunable value lives here.
 *  Four credentials (FaucetPay API key, Turnstile secret, admin
 *  username/password) are Cloudflare Secrets instead, for security —
 *  see README-cloudflare.md. Telegram bot token/chat ID are kept here
 *  as plain variables as requested, but treat this file as sensitive
 *  once the bot token is filled in.
 * ====================================================================
 */
export const CONFIG = {
  // ---- Site info ----
  SITE_NAME: 'Faucet DOGE',
  SITE_TAGLINE: 'A secure platform for claiming and managing Dogecoin rewards.',
  SITE_URL: 'https://faucet-doge.top', // no trailing slash

  // ---- FaucetPay ----
  FAUCETPAY_CURRENCY: 'DOGE',

  // ---- Faucet (claim) settings ----
  CLAIM_INTERVAL_SECONDS: 300, // 5 minutes
  CLAIM_MIN_AMOUNT: 0.00100000,
  CLAIM_MAX_AMOUNT: 0.00500000,
  MAX_CLAIMS_PER_DAY: 20,
  CLAIM_RESET_HOURS: 24,

  // ---- Dice game settings ----
  ROLL_INTERVAL_SECONDS: 600, // 10 minutes
  ROLL_MIN: 1,
  ROLL_MAX: 100000,
  MAX_ROLLS_PER_DAY: 10,
  // First matching range wins. Keep ranges contiguous and non-overlapping.
  ROLL_TABLE: [
    { min: 1,     max: 99900,  reward: 0.00100000 },
    { min: 99901, max: 99950,  reward: 0.01000000 },
    { min: 99951, max: 99990,  reward: 0.02000000 },
    { min: 99991, max: 100000, reward: 0.050000000 },
  ],

  // ---- Betting game settings ----
  // Four equally likely outcomes (25% each), one is chosen at random on every bet.
  BET_MIN_AMOUNT: 0.00100000,
  BET_MAX_AMOUNT: 0.01000000,
  BET_OUTCOMES: [
    { type: 'breakeven', multiplier: 1, label: 'No profit or loss — bet returned' },
    { type: 'win2x',     multiplier: 0.2, label: 'Win — 2x payout' },
    { type: 'win3x',     multiplier: 0.3, label: 'Win — 3x payout' },
    { type: 'lose',      multiplier: 0, label: 'Loss — bet amount forfeited' }, 
  ],

  // ---- Referral program ----
  REFERRAL_ENABLED: true,
  REFERRAL_COMMISSION_PERCENT: 10,

  // ---- Deposit levels & daily withdrawal limits ----
  // A user's level is the highest tier whose minTotalDeposit their
  // lifetime (cumulative) deposits have reached. dailyWithdrawalLimit
  // is the maximum DOGE that level may withdraw per 24-hour period.
  MIN_DEPOSIT_AMOUNT: 1.00000000,
  MIN_WITHDRAWAL_AMOUNT: 5.0500000,
  LEVELS: [
    { level: 1, minTotalDeposit: 0.00000000,  dailyWithdrawalLimit: 5.05000000 },
    { level: 2, minTotalDeposit: 5.00000000,  dailyWithdrawalLimit: 2.5500000 },
    { level: 3, minTotalDeposit: 10.00000000, dailyWithdrawalLimit: 1.05000000 },
  ],
  WITHDRAWAL_FEE_PERCENT: 0.05000000,

  // ---- Deposit addresses ----
  // One is shown at random when the user clicks "Deposit". Replace
  // these four with your real addresses once ready.
  DEPOSIT_ADDRESSES: [
    'DNeN3uJsvfp84tn9MKVCTG8jqXHpxNZVJs',
    'D5sSdxwNcRPsxEdPcNBsEEzLSdo4yj5ymA',
    'DPwpQqoiswJDMFC11pFCLT35k3wZdtpM13',
    'DMXmAJPuHAzGwYwhDe4wv9U1aWbJ4rs4uv',
  ],

  // ---- Telegram notifications for manual deposit review ----
  // Every submitted deposit (amount, hash, sender wallet) is sent here
  // so you can review and approve/reject it from the /admin panel.
  TELEGRAM_BOT_TOKEN: '8678664648:AAGJ1g15x1incbvIyaP-qXmEpTe54U8ZpBk',
  TELEGRAM_CHAT_ID: '7691139922',

  // ---- Anti-bot / captcha (Cloudflare Turnstile) ----
  CAPTCHA_ENABLED: true,
  TURNSTILE_SITE_KEY: '0x4AAAAAAECydgxh8jaXFJps',
  // ---- Advertising ----
  ADS_ENABLED: true,
  
  // ---- Misc ----
  DECIMALS: 8,
  SESSION_DAYS: 30,

    // ---- PTC Ads settings ----
  PTC_COUNT: 100,           // عدد إعلانات الـ PTC الكلي
  PTC_REWARD: 0.00100000,   // مكافأة مشاهدة الإعلان الواحد
  PTC_TIMER_SECONDS: 30,    // مدة العداد التنازلي بالثواني
  PTC_COOLDOWN_HOURS: 12,   // منع تكرار النقر على نفس الإعلان إلا بعد 12 ساعة

  // ---- Site logo / favicon ----
  // Data-URI (base64) of the doge image. Paste the base64 string here once
  // you send me the image — Workers has no static file hosting by default,
  // so embedding it as a data URI is the simplest zero-infra option.
  SITE_LOGO_DATA_URI: '', // e.g. 'data:image/png;base64,iVBORw0KGgo...'

  // ---- CCPayment (deposit gateway) ----
  // AppId is not secret (shown on the Developer page) — safe to keep here.
  // The App Secret must NEVER go in this file: set it with
  //   wrangler secret put CCPAYMENT_APP_SECRET
  CCPAYMENT_APP_ID: 'eLWsEn1MoYf5oFgA',
  CCPAYMENT_CHAIN: 'DOGE', // chain identifier for native Dogecoin deposits
  CCPAYMENT_API_BASE: 'https://admin.ccpayment.com',

  SITE_LIVE: true,
  // ---- Ad placement (Adsterra network) ----
  ADS_PER_PAGE: 5,
  ADS_PER_PTC_PAGE: 10,
};
