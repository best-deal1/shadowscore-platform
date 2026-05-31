# ShadowScore Cyber Update

This package keeps the design language of your previous site and upgrades it to a more professional cyber intelligence style.

## Files

Copy these into your Next.js project:

- app/page.tsx
- app/intake/page.tsx
- app/analysis/page.tsx
- app/radar/page.tsx
- app/report/page.tsx

## Required public assets

Keep these files in your existing public folder:

- public/shadowscore-shield-v8.png
- public/marketplaces-monitor-v8.png

## Local run

npm install
npm run dev

Open:

http://localhost:3000

## Production with Git and Vercel

git add .
git commit -m "Upgrade ShadowScore cyber intelligence UI"
git push origin main

If Vercel is connected to the repository, it will deploy automatically.

## Production manually on Vercel

npm run build

Then deploy from Vercel dashboard or run:

vercel --prod

## Replit production

npm install
npm run build
npm run start

Then use the Replit Deploy button.
