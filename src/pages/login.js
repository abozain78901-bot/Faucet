import { CONFIG } from '../config.js';
import { layout } from '../lib/render.js';

export function renderLogin({ error, ref } = {}) {
  const body = `
<h1 class="title">${CONFIG.SITE_NAME}</h1>
<p class="tagline">${CONFIG.SITE_TAGLINE}</p>






<!-- BEGIN AADS AD UNIT 2450305 -->

<div style="position: absolute; z-index: 99999">
      <input autocomplete="off" type="checkbox" id="aadsstickymsine386" hidden />
      <div style="padding-top: 0; padding-bottom: 0;">
        <div style="width:970px;height:250px;position:fixed;text-align:center;font-size:0;top:50%;transform:translateY(-50%);right:0">
          <label for="aadsstickymsine386" style="top: -24px; left: 0;; position: absolute;border-radius: 4px; background: rgba(248, 248, 249, 0.70); padding: 4px;z-index: 99999;cursor:pointer">
            <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
              <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 "/>
            </svg>
          </label>
          <div id="frame" style="width: 970px;margin: auto;z-index: 99998;height: auto display: flex;flex-direction: column; justify-content: center">
                        <iframe data-aa=2450305 src=//ad.a-ads.com/2450305/?size=970x250 style='border:0; padding:0; width:970px; height:250px; overflow:hidden; margin: 0 auto'></iframe>
                    </div>
        </div>
        <style>
      #aadsstickymsine386:checked + div {
        display: none;
      }
    </style>
    </div></div>

<!-- END AADS AD UNIT 2450305 -->



<script async="async" data-cfasync="false" src="https://pl27850433.effectivecpmnetwork.com/f078c83005d88bd6d5ca59bed3accc42/invoke.js"></script>
<div id="container-f078c83005d88bd6d5ca59bed3accc42"></div>

<script src="https://pl27826838.effectivecpmnetwork.com/87/03/5b/87035b6aea8c7569ecd3e7726bfcf2ba.js"></script>

<div class="card">
    ${error ? `<div class="alert alert-error">${error}</div>` : ''}
    <form method="post" action="/login">
    ${ref ? `<input type="hidden" name="ref" value="${ref}">` : ''}
    <label for="email">FaucetPay Account Email</label>
    <input type="email" id="email" name="email" placeholder="you@example.com" required>
        <button type="submit" class="btn">Sign In / Register</button>
    </form>
    <p class="muted center" style="margin-top:14px;">No password is required. All rewards are settled to your FaucetPay account in ${CONFIG.FAUCETPAY_CURRENCY}.</p>
</div>`
    
    
  return layout(body, { title: CONFIG.SITE_NAME, showNav: false });
}
