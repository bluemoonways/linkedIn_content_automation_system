# 🔗 LinkedIn Auto Poster

🚀 Automated LinkedIn posting system built with **Google Apps Script**, **Google Sheets**, **Google Drive**, **OAuth 2.0** and the **LinkedIn Posts API**.

This system reads queued posts from Google Sheets, prepares the content with GitHub and portfolio links, optionally retrieves images from Google Drive, publishes posts to LinkedIn via the Posts API, and updates the publishing status automatically.

---

## ✨ Features

- 📤 Automated LinkedIn posting via Posts API (`/rest/posts`)
- 🔐 OAuth 2.0 authentication (OAuth2 library v43)
- ⏰ Daily scheduled publishing (2 PM trigger)
- 📊 Google Sheets content queue
- 🖼️ Optional Google Drive images with LinkedIn Image Upload API
- 🔗 Automatic GitHub project link
- 🌐 Automatic portfolio link
- 🔍 Authorization validation & diagnostics
- 👁️ Preview next post without publishing
- 📌 Publishing status tracking
- 🕒 Published timestamp tracking
- ⚠️ Failed-post handling
- 🔒 Script Lock protection
- 🧪 Test post function

---

## 🔄 Workflow

```text
📊 Google Sheet (Queue)
      ↓
🔎 Find Next Unpublished Post
      ↓
📝 Prepare Post Content
      ├── 🔗 GitHub Link
      ├── 🌐 Portfolio Link
      └── 🖼️ Optional Drive Image
      ↓
🔐 OAuth2 → LinkedIn Access Token
      ↓
🖼️ Image Upload (if present)
      ├── POST /rest/images?action=initializeUpload
      └── PUT uploadUrl
      ↓
📡 LinkedIn Posts API
      └── POST /rest/posts
      ↓
💼 LinkedIn Profile / Feed
      ↓
📊 Update Google Sheet
      ├── ✅ Published
      └── ❌ Failed
```

---

## 📊 Google Sheet Structure

The script automatically searches for the following header names (case-insensitive):

| Header | Purpose |
|---|---|
| 📝 Post Content | Main LinkedIn post content |
| 🔗 GitHub Link | Project/repository URL |
| 🖼️ Image Link | Google Drive image URL |
| 📌 LinkedIn Status | Publishing status (`Published` / `Failed` / `Publishing`) |
| 🕒 Published At | Publication date and time |
| 📁 Repo | Optional repository/reference |
| 🔢 Serial | Optional post serial number |

Example:

| Serial | Post Content | GitHub Link | Image Link | LinkedIn Status | Published At | Repo |
|---|---|---|---|---|---:|---|
| 1 | Just built an AI expense tracker... | https://github.com/... | https://drive.google.com/file/d/... |  |  | expense-tracker |
| 2 | New n8n workflow for lead scoring... | https://github.com/... |  |  |  | lead-intelligence |

---

## ⚙️ Configuration

The project uses Google Apps Script **Script Properties** for secure configuration.

Required properties:

```text
LINKEDIN_CLIENT_ID=your_linkedin_app_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_app_client_secret
LINKEDIN_POSTS_SPREADSHEET_ID=your_google_spreadsheet_id
```

Optional alias:

```text
LINKEDIN_SPREADSHEET_ID=your_google_spreadsheet_id (fallback)
```

⚠️ **Never put real values inside `Code.gs`.**

---

## 🔐 LinkedIn App Setup (Quick)

1. Go to https://developer.linkedin.com/
2. Create App → Add **Sign In with LinkedIn** + **Share on LinkedIn** + **Marketing Developer Platform** (for `w_member_social`)
3. Set Redirect URL to your Apps Script Web App URL (deploy as web app, execute as user, access myself)
4. Request scopes: `openid`, `profile`, `email`, `w_member_social`
5. Copy Client ID & Secret to Script Properties
6. Run `showLinkedInAuthUrl()` → Authorize → Then `checkLinkedInAuthorization()`

Full steps → see [SETUP.md](SETUP.md)

---

## ⏰ Scheduling

### Create Daily Trigger (2 PM Asia/Karachi)

```javascript
setupDailyLinkedInTrigger()
```

### Remove Daily Trigger

```javascript
removeDailyLinkedInTrigger()
```

---

## 🧪 Testing & Diagnostics

### 🔍 Check LinkedIn Authorization

```javascript
checkLinkedInAuthorization()
```

### 🔎 Full Diagnostics

```javascript
diagnoseLinkedInSetup()
```

Checks:
- Script Properties
- OAuth authorization
- Access token validity
- Member ID / Author URN
- Sheet access
- Trigger status
- Next post preview

### 👁️ Preview Next Post (no publish)

```javascript
previewNextLinkedInPost()
```

### 📤 Test LinkedIn Post

```javascript
testLinkedInPost()
```

This publishes a test post to LinkedIn.

### 🔗 Get Auth URL

```javascript
showLinkedInAuthUrl()
```

---

## 🛠️ Main Functions

| Function | Purpose |
|---|---|
| 🆔 `getLinkedInClientId_()` | Reads Client ID from Script Properties |
| 🔑 `getLinkedInClientSecret_()` | Reads Client Secret |
| 📊 `getSpreadsheetId_()` | Reads Spreadsheet ID |
| 🔐 `getOAuthService_()` | Configures OAuth2 service (library v43) |
| 🔑 `getAccessToken_()` | Gets valid access token |
| ✅ `isLinkedInAuthorized_()` | Checks if authorized |
| ✅ `hasValidLinkedInAccessToken_()` | Validates token via `/v2/userinfo` |
| 🔗 `showLinkedInAuthUrl()` | Logs authorization URL |
| 🔄 `authCallback()` | OAuth callback handler |
| 🌐 `doGet()` | Web app entry for OAuth callback |
| 🆔 `getLinkedInMemberId_()` | Gets member ID via userinfo |
| 🆔 `getLinkedInAuthorUrn_()` | Builds `urn:li:person:xxx` |
| 🆔 `getDriveFileIdFromUrl_()` | Extracts Drive file ID |
| 🖼️ `getImageBlobFromDrive_()` | Retrieves image blob from Drive |
| 🖼️ `uploadImageToLinkedIn_()` | Initializes & uploads image to LinkedIn |
| 📤 `postToLinkedIn_()` | Publishes text or image post via `/rest/posts` |
| 🧪 `testLinkedInPost()` | Publishes a test post |
| ⏰ `setupDailyLinkedInTrigger()` | Creates daily 2 PM trigger |
| 🗑️ `removeDailyLinkedInTrigger()` | Removes trigger |
| 🚀 `publishNextLinkedInPost()` | Publishes next queued post |
| 👁️ `previewNextLinkedInPost()` | Previews next post without publishing |
| 🔍 `diagnoseLinkedInSetup()` | Full system diagnostics |
| 🔄 `resetLinkedInAuth()` | Resets OAuth for re-auth |

---

## 💻 Tech Stack

- 🟨 Google Apps Script (V8)
- 💛 JavaScript
- 📊 Google Sheets
- 📁 Google Drive
- 💼 LinkedIn Posts API (`/rest/posts`)
- 🖼️ LinkedIn Images API (`/rest/images`)
- 🔐 OAuth 2.0 (OAuth2 library v43 by Google)
- 🔒 Apps Script Script Properties + UserProperties
- ⏰ Apps Script Time-based Triggers
- 🌐 Apps Script Web App (OAuth callback)

---

## 🚀 Project Implementation

Built to automate LinkedIn publishing using **Google Apps Script, Google Sheets, Google Drive, OAuth 2.0 and the LinkedIn Posts API**.

The system provides a spreadsheet-based content queue, OAuth-based secure authentication, automated image upload, status tracking, preview & diagnostics, and scheduled LinkedIn posting.

👉 [View / Download Apps Script Code](Code.gs)

---

## 👨‍💻 Author

**Faheem Abbas**

🤖 AI Automation Specialist | ⚙️ n8n Expert | 🧠 AI Agents | 🚀 AI-Powered Business Automation | 🎯 Lead Generation | 🔗 API Integrations | 📞 Calling Agents

### 📩 Contact

For custom implementation or commercial use, please contact me:
<br>

<a href="https://wa.me/923002120566">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
</a>

<a href="https://www.linkedin.com/in/faheem-abbas-ai-automation-specialist/">
  <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
</a>

<a href="mailto:info.bluemoonways@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail">
</a>

---

## 🌐 Portfolio Link:
https://bluemoonways.vercel.app/
