# 🔗 LinkedIn Content Automation System

🚀 An automated LinkedIn content publishing system built with **Google Apps Script, Google Sheets, Google Drive, OAuth 2.0, and the LinkedIn API**.

The system manages a content queue in Google Sheets, prepares posts with project and portfolio links, optionally attaches images, publishes content automatically to LinkedIn, and tracks publishing status.

---

## ✨ Features

- 📤 Automated LinkedIn post publishing
- 📊 Google Sheets-based content queue
- 🖼️ Optional image publishing from Google Drive
- 🔗 Automatic GitHub project link
- 🌐 Automatic portfolio link
- ⏰ Scheduled daily publishing
- 📌 Publishing status tracking
- 🕒 Publication timestamp tracking
- 👁️ Post preview before publishing
- 🧪 Testing and authorization diagnostics
- ⚠️ Failed-post handling

---

## 🔄 Workflow

```text
📊 Google Sheets
      ↓
🔎 Find Next Unpublished Post
      ↓
📝 Prepare Content
      ├── 🔗 GitHub Link
      ├── 🌐 Portfolio Link
      └── 🖼️ Optional Image
      ↓
🔐 LinkedIn OAuth 2.0
      ↓
🖼️ Upload Image (if available)
      ↓
📡 LinkedIn API
      ↓
💼 Published LinkedIn Post
      ↓
📊 Update Publishing Status
```

---

## 📊 Content Management

Posts are managed through Google Sheets, allowing content to be prepared and queued in advance.

| Field | Purpose |
|---|---|
| 📝 Post Content | LinkedIn post content |
| 🔗 GitHub Link | Project repository |
| 🖼️ Image Link | Optional Google Drive image |
| 📌 LinkedIn Status | Publishing status |
| 🕒 Published At | Publication timestamp |
| 📁 Repo | Project reference |

---

## ⏰ Automated Publishing

The system can automatically publish queued content on a daily schedule.

```javascript
setupDailyLinkedInTrigger()
```

The scheduled workflow:

**Select → Prepare → Publish → Update Status**

---

## 🧪 Testing & Diagnostics

The project includes tools for:

- Checking LinkedIn authorization
- Validating access
- Previewing the next queued post
- Testing LinkedIn publishing
- Diagnosing configuration and publishing issues

---

## 🛠️ Tech Stack

- 🟨 Google Apps Script
- 💛 JavaScript
- 📊 Google Sheets
- 📁 Google Drive
- 💼 LinkedIn API
- 🔐 OAuth 2.0
- ⏰ Apps Script Triggers

---

## 💡 Project Highlights

This project demonstrates practical implementation of:

- API integration
- OAuth-based authentication
- Workflow automation
- Scheduled publishing
- Google Sheets automation
- Image handling
- Automated status management
- External API communication

---

## 🚀 Implementation

The system combines **Google Apps Script + Google Sheets + Google Drive + LinkedIn API** to create a lightweight content publishing workflow without requiring a separate backend server.

👉 [View Apps Script Code](Code.gs)

---

## 👨‍💻 Author

**Faheem Abbas**

AI Automation Specialist | n8n | AI Agents | Business Automation | API Integrations | Lead Generation

### 📩 Contact

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

## 🌐 Portfolio

https://bluemoonways.vercel.app/
