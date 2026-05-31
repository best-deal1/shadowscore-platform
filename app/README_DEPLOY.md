# ShadowScore V3.4 Premium Backup-Based

Built from the backup design the user uploaded and upgraded with:

- Preserved premium backup atmosphere
- Restored hero marketplace logo strip inside the hero visual
- Restored marketplace-monitor-v8 image section for real logo preview and social sharing
- Added app/head.tsx for WhatsApp, Facebook, X and LinkedIn preview
- Pricing cards aligned with equal height and CTA alignment
- Added $49, $99, $199, $299 pricing ladder
- Added MC011 / MC999 / Payout Hold / Verification case intelligence
- Preserved FAQ and marketplace disclaimer
- Kept the Cyber / Palo Alto / Check Point direction

Copy:
- app/page.tsx
- app/head.tsx
- app/intake/page.tsx

Required public assets:
- public/shadowscore-shield-v8.png
- public/marketplaces-monitor-v8.png

Test:
npm run build

Push:
git add .
git commit -m "Upgrade ShadowScore V3.4 premium backup based"
git push origin main

After deploy:
Refresh preview cache using Facebook Sharing Debugger or LinkedIn Post Inspector.
