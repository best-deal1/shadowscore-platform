# ShadowScore Pain Collector v4

This version adds a local master dataset and an Auto Monitor mode.

## What it does

- Reads only visible posts from the current browser tab
- Classifies marketplace seller pain signals
- Saves exports into Downloads/ShadowScoreCollector
- Stores a local master dataset inside Chrome storage
- Can auto-scan every 60 seconds while the popup is open

## Important limitation

Chrome closes extension popups when you click away. Auto Monitor works while the popup stays open.
For true 24/7 monitoring, use a local collector service or dashboard later.

## Install

1. Open Chrome
2. Go to chrome://extensions
3. Turn on Developer mode
4. Click Load unpacked
5. Select the chrome_extension folder

## Use

1. Open a Facebook group/page you can access
2. Scroll normally until relevant posts are visible
3. Open the extension
4. Click Collect JSON/CSV or enable Auto Monitor
5. Download master dataset when needed

## Output folder

Downloads/ShadowScoreCollector

## Safety

No login bypass.
No hidden crawling.
No background scraping.
No private data bypass.
It only reads currently visible page text after user action.
