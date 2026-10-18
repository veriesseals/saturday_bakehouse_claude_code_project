# saturday_bakehouse_claude_code_project

## Social preview

`assets/social-preview.png` (1280×640) is the GitHub repo social card. Upload it under
**Settings → General → Social preview**.

To re-render it after editing `assets/social-preview.html` / `.css`, serve the folder
(`python3 -m http.server 4173`) and run:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1280,640 --virtual-time-budget=5000 \
  --screenshot="$PWD/assets/social-preview.png" http://localhost:4173/assets/social-preview.html
```
