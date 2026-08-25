/* ═══════════════════════════════════════════════════════════════════════
   የንባብ መዝገብ · سِجِلُّ القُرّاء · Reading Log
   sw.js — عامل الخدمة (Service Worker)
   ─ التخزين المؤقت الكامل + العمل دون اتصال
   ─ الاستراتيجيات:
       ① قشرة التطبيق (App Shell): تُخزَّن كلها عند التثبيت
       ② صفحات التنقّل: المخزَّن فوراً + تحديث صامت في الخلفية
       ③ خطوط جوجل: تخزين مؤقت دائم (ملفاتها مُرقَّمة لا تتغيّر)
   ═══════════════════════════════════════════════════════════════════════ */
"use strict";

/* ──────────────── الإصدار ────────────────
   ⚠️ عند أي تعديل مستقبلي على ملفات التطبيق:
      ارفع هذا الرقم (مثلاً "v1.0.1") ليمحو المتصفح النسخة القديمة
      ويخزّن الجديدة — وإلا سيبقى المستخدمون على النسخة القديمة!        */
const VERSION     = "v1.0.0";
const SHELL_CACHE = "qira-log-shell-" + VERSION;
const FONTS_CACHE = "qira-log-fonts-" + VERSION;

/* ──────────────── ملفات قشرة التطبيق (تُخزَّن فور التثبيت) ──────────────── */
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/i18n.js",
  "./js/storage.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon.svg"
];

/* رابط خطوط جوجل — مطابق تماماً لما في index.html */
const FONTS_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400" +
  "&family=Cairo:wght@400;600;700;800" +
  "&family=Noto+Sans+Ethiopic:wght@400;500;600;700" +
  "&family=Noto+Serif+Ethiopic:wght@500;600;700&display=swap";

/* ──────────────── صفحة الطوارئ (عند غياب أي نسخة مخزَّنة — نادر جداً) ──────────────── */
const OFFLINE_HTML = [
  '<!DOCTYPE html><html lang="am"><head><meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="theme-color" content="#0f4c43">',
  '<title>የንባብ መዝገብ</title>',
  '<style>',
  'body{margin:0;min-height:100dvh;display:grid;place-items:center;',
  'background:linear-gradient(180deg,#f8f2e2,#faf6ec);color:#22302c;',
  'font-family:Georgia,"Times New Roman",serif;text-align:center;padding:2rem}',
  '.box{max-width:430px;border:1px solid #cfc2a4;border-radius:14px;',
  'padding:2rem 1.6rem;background:#fffdf7;',
  'box-shadow:0 12px 36px rgba(34,48,44,.15)}',
  'h1{color:#0f4c43;font-size:1.3rem;margin:.2rem 0 .6rem}',
  'p{line-height:1.9;margin:.2rem 0;color:#5c6b66}',
  '.ar{direction:rtl;font-size:1.05rem}',
  'hr{border:none;border-top:1px solid #e6cf8a;margin:1rem 0}',
  '</style></head><body><div class="box">',
  '<h1>የንባብ መዝገብ</h1>',
  '<p>መተግበሪያው አሁን አይገኝም።<br>እባክዎ ድጋሚ ይሞክሩ።</p>',
  '<hr>',
  '<p class="ar">التطبيق غير متاح حاليًا.<br>يُرجى إعادة المحاولة بعد قليل.</p>',
  '<hr>',
  '<p>The app is unavailable right now.<br>Please try again.</p>',
  '</div></body></html>'
].join("");

/* ═══════════════════════════════════════════════════════════════════════
   التثبيت: خزّن قشرة التطبيق كاملة
   ═══════════════════════════════════════════════════════════════════════ */
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      /* التفعيل فور اكتمال التثبيت دون انتظار إغلاق النوافذ */
      self.skipWaiting();

      /* الملفات المحلية — يجب أن تنجح كلها */
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(APP_SHELL);

      /* CSS الخطوط — بأفضل جهد: فشلها لا يُفشل التثبيت
         (ستُخزَّن لاحقاً عند أول زيارة متصلة)                            */
      try {
        const fonts = await caches.open(FONTS_CACHE);
        await fonts.add(FONTS_CSS_URL);
      } catch (e) { /* لا اتصال الآن — لا مشكلة */ }
    })()
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   التفعيل: السيطرة الفورية + تنظيف أي ذاكرة من إصدار أقدم
   ═══════════════════════════════════════════════════════════════════════ */
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== FONTS_CACHE)
          .map(k => caches.delete(k))
      );
    })()
  );
});

/* رسالة مستقبلية: السماح للصفحة بطلب تفعيل فوري للنسخة الجديدة */
self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/* ═══════════════════════════════════════════════════════════════════════
   اعتراض الطلبات وتقديمها
   ═══════════════════════════════════════════════════════════════════════ */
self.addEventListener("fetch", event => {
  const req = event.request;

  /* نتعامل مع GET فقط (بيانات التطبيق في localStorage لا تمرّ من هنا) */
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* تجاهل بروتوكولات غير http/https مثل chrome-extension: */
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  /* تجاهل طلبات النطاقات (الوسائط المتدفقة) */
  if (req.headers.has("range")) return;

  /* ① فتح صفحات التطبيق (التنقّل) */
  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }

  /* ② خطوط جوجل: CSS وملفات الخطوط */
  if (url.hostname === "fonts.googleapis.com" ||
      url.hostname === "fonts.gstatic.com") {
    event.respondWith(fontsStrategy(req));
    return;
  }

  /* ③ ملفات التطبيق المحلية (css / js / manifest / أيقونات) */
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  /* ما عدا ذلك (روابط خارجية مثل تليجرام): يمرّ للشبكة مباشرة */
});

/* ═══════════════════════════════════════════════════════════════════════
   الدوال المساعدة
   ═══════════════════════════════════════════════════════════════════════ */

/* ── التنقّل: قدّم المخزَّن فوراً (إقلاع لحظي) وحدّثه بهدوء في الخلفية ── */
async function handleNavigation(req){
  const cache  = await caches.open(SHELL_CACHE);
  const cached = (await cache.match("./index.html")) ||
                 (await cache.match("./"));

  /* تحديث خلفي صامت لا يعطّل الاستجابة أبداً */
  const refresh = fetch(req)
    .then(res => {
      if (res && res.ok){
        cache.put("./index.html", res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;      /* اتصال أو لا اتصال: الصفحة جاهزة */

  const fresh = await refresh;    /* أول زيارة: من الشبكة */
  if (fresh) return fresh;

  /* لا مخزَّن ولا شبكة: صفحة الطوارئ */
  return new Response(OFFLINE_HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/* ── الأقدم أولاً: من الذاكرة فوراً، وإلا اجلب من الشبكة وخزّنه ── */
async function cacheFirst(req, cacheName){
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === "opaque")){
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

/* ── الخطوط ──
   • ملفات gstatic: روابطها مُرقَّمة بأصناف لا تتغيّر أبداً → تخزين أبدي
   • CSS الخطوط: قدّم المخزَّن وحدّثه خلفياً (قد تُضاف أوزان جديدة)     */
async function fontsStrategy(req){
  const cache  = await caches.open(FONTS_CACHE);
  const cached = await cache.match(req);
  const isFontFile = new URL(req.url).hostname === "fonts.gstatic.com";

  /* ملف خط مخزَّن؟ قدّمه دون أي تحديث — رابطه لا يتغيّر */
  if (cached && isFontFile) return cached;

  /* CSS مخزَّن؟ قدّمه وحدّث بهدوء */
  if (cached){
    fetch(req)
      .then(res => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      })
      .catch(() => {});
    return cached;
  }

  /* غير مخزَّن: اجلبه وخزّنه */
  try {
    const res = await fetch(req);
    if (res && res.ok){
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    return new Response("", { status: 504, statusText: "Offline fonts" });
  }
}
