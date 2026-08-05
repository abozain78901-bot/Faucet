import { pickAds, renderAdPopup, AD_POPUP_CSS } from '../lib/ads.js';

export function renderPtcView({ adId }) {
  const ads = pickAds(10);
  const topAds = ads.slice(0, 5).map((a) => `<div class="ad-box">${a.html}</div>`).join('\n');
  const bottomAds = ads.slice(5, 10).map((a) => `<div class="ad-box">${a.html}</div>`).join('\n');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, initial-scale=1.0">
  <title>Watching Advertisement #${adId}</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      text-align: center;
      padding: 20px;
      margin: 0;
      width: 1200px;
      box-sizing: border-box;
    }
    .container {
      width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      color: #fbbf24;
      margin-bottom: 5px;
    }
    .subtitle {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .scroll-hint {
      font-size: 1.1rem;
      color: #38bdf8;
      font-weight: bold;
      margin-bottom: 20px;
      animation: bounce 1.5s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(5px); }
    }
    .ad-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .middle-section {
      background: #1e293b;
      border: 2px dashed #38bdf8;
      border-radius: 10px;
      padding: 20px;
      margin: 30px 0;
    }
    #timer-container {
      font-size: 1.2rem;
      font-weight: bold;
      color: #facc15;
    }
    .claim-btn {
      display: none;
      background-color: #22c55e;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .claim-btn:hover {
      background-color: #16a34a;
    }
    ${AD_POPUP_CSS}
  </style>
</head>
<body>
  <div class="container">
    <h1>Watching Advertisement #${adId}</h1>
    <p class="subtitle">Please stay on this page until the timer finishes to claim your reward.</p>
    <div class="scroll-hint">⬇️ Scroll down to view all ads and claim reward ⬇️</div>

    <!-- 5 إعلانات علوية -->
    ${topAds}

    <!-- المنتصف (العداد وزر المطالبة) -->
    <div class="middle-section">
      <div id="timer-container">Please wait: <span id="countdown">30</span>s</div>
      <button id="claimBtn" class="claim-btn">Claim Reward</button>
    </div>

    <!-- 5 إعلانات سفلية -->
    ${bottomAds}

  </div>
  ${renderAdPopup()}

  <script>
    let timeLeft = 30;
    const countdownEl = document.getElementById('countdown');
    const claimBtn = document.getElementById('claimBtn');
    const timerContainer = document.getElementById('timer-container');

    const timer = setInterval(() => {
      timeLeft--;
      countdownEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        timerContainer.style.display = 'none';
        claimBtn.style.display = 'inline-block';
      }
    }, 1000);

    claimBtn.addEventListener('click', async () => {
      claimBtn.disabled = true;
      claimBtn.textContent = 'Processing...';
      try {
        const res = await fetch('/api/ptc/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'ad_id=' + encodeURIComponent(${adId})
        });
        const data = await res.json();
        if (data.ok) {
          alert('Success! Reward added: ' + data.amount);
          window.location.href = '/ptc';
        } else {
          alert(data.message || 'Error occurred');
          claimBtn.disabled = false;
          claimBtn.textContent = 'Claim Reward';
        }
      } catch (err) {
        alert('Network error');
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Reward';
      }
    });
  </script>
</body>
</html>
  `;
}
