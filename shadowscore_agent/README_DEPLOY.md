# ShadowScore V3.3 - OG + Logos + Pricing Alignment

Changes:
- Restored marketplace logo rail with grayscale-to-color hover behavior
- Added Open Graph / Twitter preview tags in app/head.tsx
- Kept preview title: ShadowScore | Marketplace Risk Intelligence
- Uses https://shadowscore.io/marketplaces-monitor-v8.png as share preview image
- Aligned pricing card height, description area, feature list and CTA button
- Kept enterprise cyber design direction

Copy:
- app/page.tsx
- app/head.tsx

Important:
Make sure public/marketplaces-monitor-v8.png exists in production.
This image is used for WhatsApp, Facebook, X and LinkedIn previews.

Test:
npm run build

Push:
git add .
git commit -m "Restore marketplace logos and OG preview"
git push origin main

After deployment:
Use Facebook Sharing Debugger or LinkedIn Post Inspector to refresh cached previews.
