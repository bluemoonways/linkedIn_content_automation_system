# 🛠️ LinkedIn Auto Poster - Complete Setup Guide

This guide covers everything from LinkedIn Developer App creation to Google Apps Script deployment, OAuth authorization, testing, and troubleshooting.

---

## 📋 Prerequisites

- Google Account (for Apps Script, Sheets, Drive)
- LinkedIn Account
- Basic knowledge of Google Apps Script
- A Google Sheet prepared as content queue

---

## 1️⃣ Create Google Sheet (Content Queue)

1. Create a new Google Sheet
2. Add headers in first row (case-insensitive, order doesn't matter):

```
Serial | Post Content | GitHub Link | Image Link | LinkedIn Status | Published At | Repo
```

- **Post Content** (required): Main LinkedIn post text
- **GitHub Link** (optional): Project URL, auto-appended as "View Project"
- **Image Link** (optional): Google Drive shareable link (`https://drive.google.com/file/d/FILE_ID/view`)
- **LinkedIn Status** (required): Leave blank. Script will set `Publishing` / `Published` / `Failed`
- **Published At** (required): Leave blank. Script sets timestamp
- **Repo / Serial** (optional): For your reference

3. Add 1-2 test rows with content but leave Status & Published At blank
4. Copy Spreadsheet ID from URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

---

## 2️⃣ LinkedIn Developer App Setup

### A. Create App

1. Go to https://developer.linkedin.com/
2. Click **Create App**
3. Fill:
   - App name: `LinkedIn Auto Poster` (or any)
   - LinkedIn Page: select your company page (required)
   - Privacy policy URL: `https://bluemoonways.vercel.app/` or your portfolio
   - App logo: upload any
4. Click **Create App**

### B. Configure Products

Go to **Products** tab and request:

- **Sign In with LinkedIn using OpenID Connect** → Request access (instant)
- **Share on LinkedIn** → This gives `w_member_social`
- **Marketing Developer Platform** (if needed for extra scopes)

> Note: For personal feed posting, `w_member_social` is required. LinkedIn may need to verify your app for some products. OpenID product is usually auto-approved.

### C. Auth Tab - Scopes

In **Auth** tab, you should see scopes:

```
openid
profile
email
w_member_social
```

If not, add them. `w_member_social` is critical for posting.

### D. Redirect URL (Very Important)

You need your Apps Script Web App URL first. So do step 3 briefly, deploy, get URL, then come back.

1. In LinkedIn App → **Auth** → **OAuth 2.0 settings** → **Authorized redirect URLs**
2. Add your Web App URL (ends with `/exec`), e.g.:
   ```
   https://script.google.com/macros/d/SCRIPT_ID/usercallback
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```
   > The OAuth2 library uses `.../usercallback` automatically, but also add the `/exec` URL to be safe.

3. Save

### E. Copy Credentials

In **Auth** tab → **Application credentials**:

- **Client ID**
- **Client Secret** (show → copy)

Keep them safe, you will add to Script Properties.

---

## 3️⃣ Google Apps Script Project Setup

### A. Create Project

1. Go to https://script.google.com/
2. **New Project**
3. Rename to `LinkedIn Auto Poster`

### B. Add Files

- Replace `Code.gs` content with the provided [Code.gs](Code.gs)
- Add `appsscript.json`:
  - Click Project Settings (gear icon) → Check **Show "appsscript.json" manifest file in editor**
  - Go back to Editor → open `appsscript.json` → paste provided content

`appsscript.json` includes:

- OAuth2 library v43: `1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY`
- Scopes:
  - `script.external_request`
  - `script.scriptapp`
  - `spreadsheets`
  - `drive.readonly`
  - `userinfo.email`
  - `script.storage`
- Webapp config: `USER_ACCESSING`, `MYSELF`

### C. Save

Press Ctrl+S / Cmd+S

---

## 4️⃣ Script Properties (Secure Config)

1. In Apps Script → Project Settings (gear) → **Script Properties** → **Add property**

Add:

```
LINKEDIN_CLIENT_ID = your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET = your_linkedin_client_secret_here
LINKEDIN_POSTS_SPREADSHEET_ID = your_spreadsheet_id_here
```

> Alternative: `LINKEDIN_SPREADSHEET_ID` also works as fallback.

⚠️ **Never hardcode credentials in Code.gs**

---

## 5️⃣ Deploy as Web App (for OAuth Callback)

This is required for LinkedIn OAuth to work.

1. In Apps Script → **Deploy** → **New deployment**
2. Select type: **Web app**
3. Settings:
   - Description: `LinkedIn OAuth Callback v1`
   - Execute as: **User accessing the web app** (important for UserProperties)
   - Who has access: **Only myself** (or Anyone with Google account, if you want)
4. Click **Deploy**
5. Authorize access when prompted (Google OAuth screen)
6. Copy **Web app URL** (ends with `/exec`)

Now go back to LinkedIn Developer App → Add this URL to Redirect URLs (Step 2D)

Also note: OAuth2 library automatically uses:
```
https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
```
Add this one too in LinkedIn.

---

## 6️⃣ Authorize LinkedIn

1. In Apps Script Editor, select function `showLinkedInAuthUrl` → **Run**
2. Authorize Google permissions if asked
3. Check **Logs** (View → Logs or Ctrl+Enter): you will see a LinkedIn authorization URL
4. Open that URL in browser
5. Log in to LinkedIn → Allow access
6. You should see: **✅ LinkedIn Authorization Successful!**

If you see error, check:
- Redirect URLs in LinkedIn App match
- Scopes are correct
- Client ID/Secret correct in Script Properties

### Verify Authorization

Run:

```javascript
checkLinkedInAuthorization()
```

Expected: `SUCCESS: LinkedIn access token is valid.`

Or run full diagnostics:

```javascript
diagnoseLinkedInSetup()
```

---

## 7️⃣ Test Posting

### Preview (Safe, No Publish)

```javascript
previewNextLinkedInPost()
```

Check logs for final content.

### Test Post (Publishes to LinkedIn)

```javascript
testLinkedInPost()
```

This publishes:

```
🚀 Testing my LinkedIn automation with Google Apps Script...
```

Check your LinkedIn profile to confirm.

### Publish Next from Sheet

```javascript
publishNextLinkedInPost()
```

- Reads first row where Status != Published/Publishing and Post Content not empty
- Appends GitHub link + Portfolio link
- Uploads image if Drive link present
- Posts to LinkedIn
- Updates Status to Published + timestamp, or Failed on error

---

## 8️⃣ Setup Daily Trigger (Automation)

To auto-publish daily at 2 PM (Asia/Karachi timezone, set in manifest):

```javascript
setupDailyLinkedInTrigger()
```

Check: Triggers (clock icon in left sidebar) → Should show `publishNextLinkedInPost` Time-driven Daily 2 PM

To remove:

```javascript
removeDailyLinkedInTrigger()
```

---

## 9️⃣ Google Drive Images (Optional)

For image posts:

1. Upload image to Google Drive
2. Right-click → Share → Anyone with link (Viewer)
3. Copy link: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
4. Paste into **Image Link** column

Script handles:

- Extracts file ID via regex `/\/d\/([a-zA-Z0-9_-]+)/` or `?id=`
- Tries `DriveApp.getFileById()` first
- Falls back to `https://drive.google.com/uc?export=download&id=FILE_ID`

Supported: JPG, PNG, GIF (LinkedIn prefers JPG/PNG, < 10MB)

---

## 🔧 How LinkedIn Posting Works (Technical)

### 1. OAuth2

- Library: OAuth2 v43 by Google (`1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY`)
- PropertyStore: UserProperties (per user)
- Scopes: `openid profile email w_member_social`
- Token endpoint: `https://www.linkedin.com/oauth/v2/accessToken`
- Auth endpoint: `https://www.linkedin.com/oauth/v2/authorization`

### 2. Get Member ID

```
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {access_token}
```

Returns `sub` → Member ID → `urn:li:person:{sub}`

### 3. Image Upload (if image present)

```
POST https://api.linkedin.com/rest/images?action=initializeUpload
Body: { initializeUploadRequest: { owner: urn:li:person:xxx } }
Headers: Authorization Bearer, LinkedIn-Version: 202405, X-Restli-Protocol-Version: 2.0.0

→ Response: { value: { uploadUrl, image: urn:li:image:xxx } }

PUT {uploadUrl}
Body: binary bytes
Header: Authorization Bearer

→ Returns 200/201
```

### 4. Create Post

```
POST https://api.linkedin.com/rest/posts
Headers: Authorization Bearer, LinkedIn-Version: 202405, X-Restli-Protocol-Version: 2.0.0
Body:
{
  author: urn:li:person:xxx,
  commentary: "Post text...",
  visibility: PUBLIC,
  distribution: { feedDistribution: MAIN_FEED, ... },
  lifecycleState: PUBLISHED,
  content: { media: { id: urn:li:image:xxx } } // optional
}
```

Returns post URN or ID via `x-restli-id` header.

---

## 🧪 Local Tests (Offline)

The repo includes offline tests that don't need Google services:

```bash
node tests/local-test.js
```

Expected: `RESULT: 56 passed, 0 failed`

Tests check:

- Files exist
- No hardcoded credentials
- OAuth2 library v43 present
- LinkedIn endpoints present
- Functions exist
- Manifest scopes
- Sheet handling
- Safety checks

---

## ❗ Troubleshooting

### 1. `LINKEDIN_CLIENT_ID not set`

- Go to Project Settings → Script Properties → Add missing property
- Check spelling: `LINKEDIN_CLIENT_ID` (all caps, underscore)

### 2. `LinkedIn not authorized. Run showLinkedInAuthUrl()`

- You haven't authorized yet
- Run `showLinkedInAuthUrl()` → Open URL → Allow
- If still fails, run `resetLinkedInAuth()` then re-authorize

### 3. `NOT AUTHORIZED / ACCESS TOKEN INVALID`

- Token expired or revoked
- Run `showLinkedInAuthUrl()` again
- Check LinkedIn App is not deleted/suspended
- Check redirect URL still valid

### 4. `Failed to get LinkedIn member ID`

- Token may lack `openid` / `profile` scopes
- Ensure LinkedIn App has OpenID Connect product approved
- Try re-authorizing after adding product

### 5. `LinkedIn image initializeUpload failed`

- Check `w_member_social` scope is granted
- Ensure token valid: `checkLinkedInAuthorization()`
- Image blob may be null → Check Drive file permissions (Anyone with link)
- LinkedIn image size limit: < 10MB, check file

### 6. `LinkedIn post failed. HTTP 403`

- Common causes:
  - Missing `w_member_social` scope
  - App not verified for Share on LinkedIn
  - Member hasn't granted permission
  - Duplicate post (LinkedIn detects duplicate content)
- Solution:
  - Re-authorize with correct scopes
  - Change post content slightly
  - Check LinkedIn App → Products → Share on LinkedIn status

### 7. `No unpublished LinkedIn posts remaining`

- Sheet has no rows where Status blank and Post Content present
- Check headers: Must have `Post Content` and `LinkedIn Status` or `Status`
- Check Status values: If `Published` or `Publishing`, row skipped
- Add new row with content and blank Status

### 8. `Another LinkedIn publishing process is already running`

- LockService prevents concurrent runs
- Wait 30 seconds and retry
- If stuck, check Apps Script Executions page for hanging runs

### 9. Drive image not posting, but text posts work

- Check Drive link format: Must contain `/d/FILE_ID/` or `?id=FILE_ID`
- File must be shared: Anyone with link → Viewer
- Try public download fallback: `https://drive.google.com/uc?export=download&id=FILE_ID` should work in incognito
- Check file is image (not PDF, etc.)

### 10. Trigger not running daily

- Check Triggers page: Does `publishNextLinkedInPost` exist?
- If not, run `setupDailyLinkedInTrigger()`
- Check Apps Script timezone: `appsscript.json` → `Asia/Karachi`, trigger runs at 2 PM that timezone
- Check Executions page for failures
- Ensure OAuth still valid (tokens expire after 60 days, need re-auth)

### 11. `FB_PAGE_ID not set` or Facebook errors (old code)

- You are running old Facebook code, not LinkedIn
- Ensure `Code.gs` is latest LinkedIn version

### 12. Web App URL changed after new deployment

- Each new deployment creates new `/exec` URL
- Update LinkedIn App → Redirect URLs with new URL
- Also keep `/usercallback` URL (based on script ID, stable)

---

## 🔐 Safety Checklist Before Pushing to GitHub

- [ ] No real Client ID / Secret in Code.gs (only in Script Properties)
- [ ] No Spreadsheet ID hardcoded
- [ ] No Access Token hardcoded
- [ ] `appsscript.json` does not contain secrets
- [ ] README has portfolio link but no secrets
- [ ] Tests pass: `node tests/local-test.js`

---

## 📚 Useful Links

- LinkedIn API Docs: https://learn.microsoft.com/en-us/linkedin/
- LinkedIn Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- LinkedIn Images API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
- OAuth2 Library: https://github.com/googleworkspace/apps-script-oauth2
- Google Apps Script: https://script.google.com/
- Author Portfolio: https://bluemoonways.vercel.app/

---

## 👨‍💻 Author

**Faheem Abbas** - AI Automation Specialist

- WhatsApp: https://wa.me/923002120566
- LinkedIn: https://www.linkedin.com/in/faheem-abbas-ai-automation-specialist/
- Gmail: info.bluemoonways@gmail.com
- Portfolio: https://bluemoonways.vercel.app/
