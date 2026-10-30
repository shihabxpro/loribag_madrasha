# লড়িবাগ মধ্যপাড়া নূরানী হাফিজিয়া মাদ্রাসা ও এতিমখানা

সিঙ্গেল-ফাইল পোর্টফোলিও সাইট। সোর্স **TypeScript**-এ লেখা, বিল্ড করে `index.html`-এ সব ইনলাইন করা হয়
(ফন্ট, CSS, JS) — তাই আউটপুট ফাইলটি ইন্টারনেট ছাড়াই ঠিকভাবে চলে।

## ফাইল স্ট্রাকচার

```
src/
  main.ts       — সব ইন্টারঅ্যাকশন (TypeScript, strict)
  styles.css    — স্টাইল ও ৫টি কালার প্যালেট টোকেন
  fonts.css     — বাংলা (Noto Serif Bengali) + আরবি (Mahameru Arabic DEMO), base64 এম্বেডেড
assets/fonts/ — Mahameru ডেমো ফন্ট (মূল + arabic-subset woff2)
  body.html     — মার্কআপ শেল (__FONTS__ / __STYLES__ / __SCRIPT__ প্লেসহোল্ডার)
scripts/
  build.mjs     — esbuild দিয়ে TS বান্ডল করে index.html তৈরি করে
index.html      — বিল্ড আউটপুট (এটাই ডেলিভারেবল)
```

## কমান্ড

```bash
npm install     # প্রথমবার
npm run typecheck   # tsc --noEmit
npm run build       # টাইপচেক + index.html জেনারেট
```

## ফন্ট লাইসেন্স নোট

**Mahameru Arabic DEMO** (ডিজাইন: NamelaType) শুধু ব্যক্তিগত/নন-কমার্সিয়াল ব্যবহারের জন্য।
মাদ্রাসার সাইট কমার্সিয়াল না হলে সমস্যা নেই; কমার্সিয়াল ব্যবহারে পূর্ণ ভার্সন কিনতে হবে
(নাহলে মিল থাকা অন্য ফন্টে বদলে দেওয়া যাবে)।

## পারফরম্যান্স

- আরবি ফন্ট arabic-subset (~16 KB) হিসেবে এম্বেড করা — ডেমো ফাইলের ৮৫ KB এর বদলে
- কোনো এক্সটার্নাল রিকোয়েস্ট নেই (ফন্ট, CSS, JS সব ইনলাইন)
- CSS-এ ভারী `backdrop-filter`/`blur()` শুধু টপবার ও ড্রয়ারে রাখা; স্ট্যাট প্যানেল ও hিরোতে বাদ
- অ্যানিমেশন শুধু `transform`-এ (`will-change`) — রিপেইন্ট ছাড়াই কম্পোজিটরে চলে

## নোট

- টাইপচেক: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — সব চালু।
- প্যালেট বাছাই `localStorage`-এ সেভ হয়, রিলোডে মনে থাকে।
- স্ট্যাট সংখ্যা বদলাতে `src/body.html`-এ `.stat__num`-এর `data-count` বদলে `npm run build` চালান।
