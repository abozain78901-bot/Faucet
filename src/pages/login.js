import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';

export function renderLogin({ error } = {}) {
  const body = `
<h1 class="title">${CONFIG.SITE_NAME}</h1>
<p class="tagline">${CONFIG.SITE_TAGLINE}</p>


<!-- BEGIN AADS AD UNIT 2450305 -->

<div id="frame" style="width: 100%;margin: auto;position: relative; z-index: 99998;">
          <iframe data-aa='2450305' src='//acceptable.a-ads.com/2450305/?size=Adaptive'
                            style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
        </div>

<!-- END AADS AD UNIT 2450305 -->




<script>
  atOptions = {
    'key' : '4c1c05cc3769478251a0e23cc9f6989f',
    'format' : 'iframe',
    'height' : 300,
    'width' : 160,
    'params' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/4c1c05cc3769478251a0e23cc9f6989f/invoke.js"></script>


<script async="async" data-cfasync="false" src="https://pl27850433.effectivecpmnetwork.com/f078c83005d88bd6d5ca59bed3accc42/invoke.js"></script>
<div id="container-f078c83005d88bd6d5ca59bed3accc42"></div>

<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>

<div class="card">
    ${error ? `<div class="alert alert-error">${error}</div>` : ''}
    <form method="post" action="/login">
        <label for="email">FaucetPay Account Email</label>
        <input type="email" id="email" name="email" placeholder="you@example.com" required>
        <button type="submit" class="btn">Sign In / Register</button>
    </form>
    <p class="muted center" style="margin-top:14px;">No password is required. All rewards are settled to your FaucetPay account in ${CONFIG.FAUCETPAY_CURRENCY}.</p>
</div>`
    
    
  return layout(body, { title: CONFIG.SITE_NAME, showNav: false });
}
