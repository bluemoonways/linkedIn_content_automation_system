/**
 * ============================================================
 * LINKEDIN AUTO POSTER - GOOGLE APPS SCRIPT
 * ============================================================
 * Automated LinkedIn posting system built with:
 * - Google Apps Script
 * - Google Sheets (content queue)
 * - Google Drive (optional images)
 * - OAuth 2.0 (LinkedIn)
 * - LinkedIn Posts API (rest/posts)
 *
 * Author: Faheem Abbas | BlueMoonWays
 * Portfolio: https://bluemoonways.vercel.app/
 * ============================================================
 */

// ============================================================
// CONSTANTS
// ============================================================
const PORTFOLIO_LINK_ = 'https://bluemoonways.vercel.app/';
const LINKEDIN_API_VERSION_ = '202405';
const LINKEDIN_RESTLI_VERSION_ = '2.0.0';

// ============================================================
// CONFIG - Script Properties Helpers
// ============================================================

/**
 * Get LinkedIn Client ID from Script Properties
 */
function getLinkedInClientId_() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('LINKEDIN_CLIENT_ID');

  if (!clientId) {
    throw new Error(
      'LINKEDIN_CLIENT_ID not set in Script Properties. ' +
      'Please add your LinkedIn App Client ID.'
    );
  }

  return clientId;
}

/**
 * Get LinkedIn Client Secret from Script Properties
 */
function getLinkedInClientSecret_() {
  const props = PropertiesService.getScriptProperties();
  const clientSecret = props.getProperty('LINKEDIN_CLIENT_SECRET');

  if (!clientSecret) {
    throw new Error(
      'LINKEDIN_CLIENT_SECRET not set in Script Properties. ' +
      'Please add your LinkedIn App Client Secret.'
    );
  }

  return clientSecret;
}

/**
 * Get Spreadsheet ID from Script Properties
 */
function getSpreadsheetId_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId =
    props.getProperty('LINKEDIN_POSTS_SPREADSHEET_ID') ||
    props.getProperty('LINKEDIN_SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error(
      'LINKEDIN_POSTS_SPREADSHEET_ID not set in Script Properties. ' +
      'Please add your Google Sheet ID.'
    );
  }

  return spreadsheetId;
}

// ============================================================
// OAUTH 2.0 - LinkedIn
// ============================================================

/**
 * Create and configure OAuth2 service for LinkedIn
 * Uses OAuth2 library v43: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY
 */
function getOAuthService_() {
  const clientId = getLinkedInClientId_();
  const clientSecret = getLinkedInClientSecret_();

  return OAuth2.createService('LinkedIn')
    .setAuthorizationBaseUrl('https://www.linkedin.com/oauth/v2/authorization')
    .setTokenUrl('https://www.linkedin.com/oauth/v2/accessToken')
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('openid profile email w_member_social')
    .setParam('response_type', 'code')
    .setParam('state', 'linkedin_auto_poster_state');
}

/**
 * Get valid access token, throws if not authorized
 */
function getAccessToken_() {
  const service = getOAuthService_();

  if (!service.hasAccess()) {
    throw new Error(
      'LinkedIn not authorized. Run showLinkedInAuthUrl() and authorize first.'
    );
  }

  return service.getAccessToken();
}

/**
 * Check if LinkedIn is authorized
 */
function isLinkedInAuthorized_() {
  try {
    const service = getOAuthService_();
    return service.hasAccess();
  } catch (err) {
    Logger.log('Authorization check error: ' + err);
    return false;
  }
}

/**
 * Check whether LinkedIn access token is usable
 */
function hasValidLinkedInAccessToken_() {
  try {
    const service = getOAuthService_();

    if (!service.hasAccess()) {
      return false;
    }

    const token = service.getAccessToken();

    const url = 'https://api.linkedin.com/v2/userinfo';

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      Logger.log(
        'LinkedIn token check failed: ' + response.getContentText()
      );
    }

    return statusCode === 200;

  } catch (err) {
    Logger.log('LinkedIn token check error: ' + err);
    return false;
  }
}

/**
 * Show LinkedIn Authorization URL (run this manually)
 */
function showLinkedInAuthUrl() {
  const service = getOAuthService_();
  const authUrl = service.getAuthorizationUrl();

  Logger.log('====================================');
  Logger.log('Open this URL to authorize LinkedIn:');
  Logger.log(authUrl);
  Logger.log('====================================');

  return authUrl;
}

/**
 * OAuth callback handler - used as web app callback
 */
function authCallback(request) {
  const service = getOAuthService_();
  const authorized = service.handleCallback(request);

  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<h2>✅ LinkedIn Authorization Successful!</h2>' +
      '<p>You can now close this window and run your posting functions.</p>' +
      '<p>Portfolio: <a href="' + PORTFOLIO_LINK_ + '">' + PORTFOLIO_LINK_ + '</a></p>'
    );
  } else {
    return HtmlService.createHtmlOutput(
      '<h2>❌ LinkedIn Authorization Failed</h2>' +
      '<p>Denied: ' + service.getLastError() + '</p>'
    );
  }
}

/**
 * Handle OAuth callback via doGet for web app deployment
 */
function doGet(e) {
  return authCallback(e);
}

/**
 * Check LinkedIn authorization (manual diagnostics)
 */
function checkLinkedInAuthorization() {
  if (hasValidLinkedInAccessToken_()) {
    Logger.log('SUCCESS: LinkedIn access token is valid.');
  } else {
    Logger.log('NOT AUTHORIZED / ACCESS TOKEN INVALID.');
    Logger.log('Run showLinkedInAuthUrl() to authorize.');
  }
}

// ============================================================
// LINKEDIN MEMBER / AUTHOR
// ============================================================

/**
 * Get LinkedIn Member ID via userinfo endpoint (OpenID)
 */
function getLinkedInMemberId_() {
  const token = getAccessToken_();

  const url = 'https://api.linkedin.com/v2/userinfo';

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    throw new Error(
      'Failed to get LinkedIn member ID. HTTP ' +
      statusCode + ': ' + responseText
    );
  }

  const data = JSON.parse(responseText);

  // OpenID Connect returns 'sub' as member ID
  const memberId = data.sub || data.id;

  if (!memberId) {
    throw new Error('Could not extract member ID from userinfo: ' + responseText);
  }

  return memberId;
}

/**
 * Get LinkedIn Author URN (urn:li:person:xxx)
 */
function getLinkedInAuthorUrn_() {
  const memberId = getLinkedInMemberId_();
  return 'urn:li:person:' + memberId;
}

// ============================================================
// GOOGLE DRIVE - Image Handling
// ============================================================

/**
 * Extract Google Drive file ID from a share link
 */
function getDriveFileIdFromUrl_(url) {
  if (!url) {
    return null;
  }

  const match =
    String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (match && match[1]) {
    return match[1];
  }

  const altMatch =
    String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (altMatch && altMatch[1]) {
    return altMatch[1];
  }

  return null;
}

/**
 * Get image blob from a Google Drive link
 * (tries DriveApp first, falls back to public download URL)
 */
function getImageBlobFromDrive_(driveImageUrl) {
  try {
    const fileId =
      getDriveFileIdFromUrl_(driveImageUrl);

    if (!fileId) {
      Logger.log(
        'Could not extract Drive file ID from: ' + driveImageUrl
      );
      return null;
    }

    let blob = null;

    try {
      const file = DriveApp.getFileById(fileId);
      blob = file.getBlob();

      Logger.log(
        'Image fetched via DriveApp for file ID: ' + fileId
      );

    } catch (driveErr) {
      Logger.log(
        'DriveApp access failed (' + driveErr +
        '), falling back to public download URL.'
      );

      const downloadUrl =
        'https://drive.google.com/uc?export=download&id=' + fileId;

      const downloadResponse =
        UrlFetchApp.fetch(downloadUrl, { muteHttpExceptions: true });

      const downloadStatus =
        downloadResponse.getResponseCode();

      if (downloadStatus !== 200) {
        Logger.log(
          'Public download fallback also failed. HTTP ' +
          downloadStatus + '. Skipping image.'
        );
        return null;
      }

      blob = downloadResponse.getBlob();

      Logger.log(
        'Image fetched via public download URL for file ID: ' + fileId
      );
    }

    return blob;

  } catch (err) {
    Logger.log('Image fetch threw an error, skipping image: ' + err);
    return null;
  }
}

// ============================================================
// LINKEDIN IMAGE UPLOAD
// ============================================================

/**
 * Upload image to LinkedIn and return image URN
 * Uses LinkedIn Images API: POST /rest/images?action=initializeUpload
 */
function uploadImageToLinkedIn_(imageBlob, authorUrn, accessToken) {
  if (!imageBlob) {
    return null;
  }

  const token = accessToken || getAccessToken_();
  const owner = authorUrn || getLinkedInAuthorUrn_();

  // Step 1: Initialize upload
  const initUrl =
    'https://api.linkedin.com/rest/images?action=initializeUpload';

  const initPayload = {
    initializeUploadRequest: {
      owner: owner
    }
  };

  const initResponse = UrlFetchApp.fetch(initUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(initPayload),
    headers: {
      'Authorization': 'Bearer ' + token,
      'LinkedIn-Version': LINKEDIN_API_VERSION_,
      'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION_
    },
    muteHttpExceptions: true
  });

  const initStatus = initResponse.getResponseCode();
  const initText = initResponse.getContentText();

  Logger.log('LinkedIn Image Init Status: ' + initStatus);
  Logger.log('LinkedIn Image Init Response: ' + initText);

  if (initStatus !== 200) {
    throw new Error(
      'LinkedIn image initializeUpload failed. HTTP ' +
      initStatus + ': ' + initText
    );
  }

  const initData = JSON.parse(initText);
  const uploadUrl = initData.value.uploadUrl;
  const imageUrn = initData.value.image;

  if (!uploadUrl || !imageUrn) {
    throw new Error(
      'Invalid initializeUpload response: ' + initText
    );
  }

  // Step 2: Upload binary
  const uploadResponse = UrlFetchApp.fetch(uploadUrl, {
    method: 'put',
    payload: imageBlob.getBytes(),
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  });

  const uploadStatus = uploadResponse.getResponseCode();

  Logger.log('LinkedIn Image Upload Status: ' + uploadStatus);

  if (uploadStatus !== 200 && uploadStatus !== 201) {
    throw new Error(
      'LinkedIn image binary upload failed. HTTP ' +
      uploadStatus + ': ' + uploadResponse.getContentText()
    );
  }

  Logger.log('Image uploaded successfully. URN: ' + imageUrn);

  return imageUrn;
}

// ============================================================
// LINKEDIN POSTING
// ============================================================

/**
 * Post a message (with optional image) to LinkedIn
 * Returns the created post ID/URN
 */
function postToLinkedIn_(message, imageBlob) {
  const token = getAccessToken_();
  const authorUrn = getLinkedInAuthorUrn_();

  let imageUrn = null;

  if (imageBlob) {
    try {
      imageUrn = uploadImageToLinkedIn_(imageBlob, authorUrn, token);
    } catch (imgErr) {
      Logger.log('Image upload failed, posting as text only: ' + imgErr);
      imageUrn = null;
    }
  }

  let postBody;

  if (imageUrn) {
    postBody = {
      author: authorUrn,
      commentary: message,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      content: {
        media: {
          id: imageUrn
        }
      }
    };
  } else {
    postBody = {
      author: authorUrn,
      commentary: message,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED'
    };
  }

  const url = 'https://api.linkedin.com/rest/posts';

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(postBody),
    headers: {
      'Authorization': 'Bearer ' + token,
      'LinkedIn-Version': LINKEDIN_API_VERSION_,
      'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION_
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log('LinkedIn POST HTTP Status: ' + statusCode);
  Logger.log('LinkedIn POST Response: ' + responseText);

  if (statusCode !== 200 && statusCode !== 201) {
    throw new Error(
      'LinkedIn post failed. HTTP ' +
      statusCode + ': ' + responseText
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (e) {
    // Some responses return header id only
    const postIdHeader = response.getHeaders()['x-restli-id'] ||
                         response.getHeaders()['X-Restli-Id'] ||
                         responseText;
    return postIdHeader;
  }

  return data.id || data.urn || response.getHeaders()['x-restli-id'] || '';
}

/**
 * Test LinkedIn text post
 */
function testLinkedInPost() {
  const postId =
    postToLinkedIn_(
      '🚀 Testing my LinkedIn automation with Google Apps Script.\n\n' +
      'This is a test post from my LinkedIn Auto Poster system.\n\n' +
      '🌐 Portfolio: ' + PORTFOLIO_LINK_,
      null
    );

  Logger.log(
    'SUCCESS: LinkedIn test post published. Post ID: ' + postId
  );

  return postId;
}

// ============================================================
// SCHEDULING - Daily Trigger
// ============================================================

/**
 * Setup a daily trigger for publishNextLinkedInPost() at 2 PM
 */
function setupDailyLinkedInTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'publishNextLinkedInPost') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('publishNextLinkedInPost')
    .timeBased()
    .atHour(14)
    .everyDays(1)
    .create();

  Logger.log(
    'Daily trigger set: publishNextLinkedInPost will run around 2 PM every day.'
  );
}

/**
 * Remove the daily LinkedIn publishing trigger
 */
function removeDailyLinkedInTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removedCount = 0;

  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'publishNextLinkedInPost') {
      ScriptApp.deleteTrigger(trigger);
      removedCount++;
    }
  });

  Logger.log(removedCount + ' trigger(s) removed.');
}

// ============================================================
// CORE - Publish Next Post from Sheet
// ============================================================

/**
 * Publish the next unpublished LinkedIn post
 *
 * Expected Sheet Headers (case-insensitive):
 * - Post Content / Content / Message
 * - GitHub Link / Repo Link
 * - Image Link / Image URL / Drive Image
 * - LinkedIn Status / Status
 * - Published At / Published Date
 * - Repo / Repository
 * - Serial / No
 */
function publishNextLinkedInPost() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error(
      'Another LinkedIn publishing process is already running.'
    );
  }

  try {
    const spreadsheetId = getSpreadsheetId_();

    const sheet =
      SpreadsheetApp.openById(spreadsheetId).getSheets()[0];

    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      throw new Error('No posts found in the Google Sheet.');
    }

    const headers = data[0].map(function(header) {
      return String(header).trim().toLowerCase();
    });

    // Flexible header detection
    const postContentColumn = headers.findIndex(function(h) {
      return h.includes('post content') || h === 'content' || h === 'message' || h === 'post';
    });
    const githubLinkColumn = headers.findIndex(function(h) {
      return h.includes('github') || h.includes('repo link') || h === 'link';
    });
    const imageLinkColumn = headers.findIndex(function(h) {
      return h.includes('image');
    });
    const linkedInStatusColumn = headers.findIndex(function(h) {
      return h.includes('linkedin status') || h === 'status' || h.includes('facebook status');
    });
    const publishedAtColumn = headers.findIndex(function(h) {
      return h.includes('published at') || h.includes('published date') || h === 'published';
    });
    const repoColumn = headers.indexOf('repo');
    const serialColumn = headers.findIndex(function(h) {
      return h === 'serial' || h === 'no' || h === 's.no' || h === '#';
    });

    if (postContentColumn === -1) {
      throw new Error('Post Content column was not found. Expected header: "Post Content"');
    }
    if (linkedInStatusColumn === -1) {
      throw new Error('LinkedIn Status column was not found. Expected header: "LinkedIn Status" or "Status"');
    }
    if (publishedAtColumn === -1) {
      throw new Error('Published At column was not found. Expected header: "Published At"');
    }

    let targetRow = -1;

    for (let i = 1; i < data.length; i++) {
      const postContent =
        String(data[i][postContentColumn] || '').trim();

      const linkedInStatus =
        String(data[i][linkedInStatusColumn] || '')
          .trim()
          .toLowerCase();

      if (
        postContent &&
        linkedInStatus !== 'published' &&
        linkedInStatus !== 'publishing'
      ) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      Logger.log('No unpublished LinkedIn posts remaining.');
      return;
    }

    const rowData =
      sheet.getRange(targetRow, 1, 1, data[0].length).getValues()[0];

    const postContent =
      String(rowData[postContentColumn] || '').trim();

    const githubLink =
      githubLinkColumn !== -1
        ? String(rowData[githubLinkColumn] || '').trim()
        : '';

    const imageLink =
      imageLinkColumn !== -1
        ? String(rowData[imageLinkColumn] || '').trim()
        : '';

    const serial =
      serialColumn !== -1 ? rowData[serialColumn] : targetRow - 1;

    const repo =
      repoColumn !== -1 ? rowData[repoColumn] : '';

    let finalPostContent = postContent;

    if (githubLink) {
      finalPostContent +=
        '\n\n🔗 View Project:\n' + githubLink;
    }

    finalPostContent +=
      '\n\n🌐 Portfolio:\n' + PORTFOLIO_LINK_;

    Logger.log('====================================');
    Logger.log('Preparing LinkedIn post');
    Logger.log('Sheet row: ' + targetRow);
    Logger.log('Serial: ' + serial);
    Logger.log('Repo: ' + repo);
    Logger.log('Image Link: ' + (imageLink || 'None'));
    Logger.log('----- FINAL CONTENT START -----');
    Logger.log(finalPostContent);
    Logger.log('----- FINAL CONTENT END -----');
    Logger.log('====================================');

    // Mark as Publishing
    sheet.getRange(targetRow, linkedInStatusColumn + 1)
      .setValue('Publishing');
    SpreadsheetApp.flush();

    let imageBlob = null;

    if (imageLink) {
      imageBlob = getImageBlobFromDrive_(imageLink);
    }

    try {
      const postId =
        postToLinkedIn_(finalPostContent, imageBlob);

      sheet.getRange(targetRow, linkedInStatusColumn + 1)
        .setValue('Published');

      sheet.getRange(targetRow, publishedAtColumn + 1)
        .setValue(new Date());

      SpreadsheetApp.flush();

      Logger.log(
        'SUCCESS: Post published. LinkedIn Post ID: ' + postId
      );

      return postId;

    } catch (postErr) {
      sheet.getRange(targetRow, linkedInStatusColumn + 1)
        .setValue('Failed');

      SpreadsheetApp.flush();

      throw postErr;
    }

  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// PREVIEW - Without Publishing
// ============================================================

/**
 * Preview the next LinkedIn post without publishing
 * Useful for diagnostics and content review
 */
function previewNextLinkedInPost() {
  const spreadsheetId = getSpreadsheetId_();

  const sheet =
    SpreadsheetApp.openById(spreadsheetId).getSheets()[0];

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error('No posts found in the Google Sheet.');
  }

  const headers = data[0].map(function(header) {
    return String(header).trim().toLowerCase();
  });

  const postContentColumn = headers.findIndex(function(h) {
    return h.includes('post content') || h === 'content' || h === 'message';
  });
  const githubLinkColumn = headers.findIndex(function(h) {
    return h.includes('github');
  });
  const imageLinkColumn = headers.findIndex(function(h) {
    return h.includes('image');
  });
  const linkedInStatusColumn = headers.findIndex(function(h) {
    return h.includes('linkedin status') || h === 'status';
  });
  const publishedAtColumn = headers.findIndex(function(h) {
    return h.includes('published at');
  });

  let targetRow = -1;

  for (let i = 1; i < data.length; i++) {
    const postContent =
      String(data[i][postContentColumn] || '').trim();

    const linkedInStatus =
      String(data[i][linkedInStatusColumn] || '')
        .trim()
        .toLowerCase();

    if (
      postContent &&
      linkedInStatus !== 'published' &&
      linkedInStatus !== 'publishing'
    ) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    Logger.log('No unpublished LinkedIn posts remaining for preview.');
    return null;
  }

  const rowData =
    sheet.getRange(targetRow, 1, 1, data[0].length).getValues()[0];

  const postContent =
    String(rowData[postContentColumn] || '').trim();

  const githubLink =
    githubLinkColumn !== -1
      ? String(rowData[githubLinkColumn] || '').trim()
      : '';

  const imageLink =
    imageLinkColumn !== -1
      ? String(rowData[imageLinkColumn] || '').trim()
      : '';

  let finalPostContent = postContent;

  if (githubLink) {
    finalPostContent +=
      '\n\n🔗 View Project:\n' + githubLink;
  }

  finalPostContent +=
    '\n\n🌐 Portfolio:\n' + PORTFOLIO_LINK_;

  const preview = {
    row: targetRow,
    content: finalPostContent,
    imageLink: imageLink || null,
    rawContent: postContent,
    githubLink: githubLink || null
  };

  Logger.log('====================================');
  Logger.log('PREVIEW - Next LinkedIn Post');
  Logger.log('Row: ' + preview.row);
  Logger.log('Image: ' + (preview.imageLink || 'None'));
  Logger.log('----- PREVIEW CONTENT START -----');
  Logger.log(preview.content);
  Logger.log('----- PREVIEW CONTENT END -----');
  Logger.log('====================================');

  return preview;
}

// ============================================================
// DIAGNOSTICS
// ============================================================

/**
 * Full diagnostics for LinkedIn Auto Poster setup
 */
function diagnoseLinkedInSetup() {
  Logger.log('====================================');
  Logger.log('🔍 LinkedIn Auto Poster Diagnostics');
  Logger.log('====================================');

  // Check Script Properties
  try {
    const clientId = getLinkedInClientId_();
    Logger.log('✅ LINKEDIN_CLIENT_ID is set: ' + clientId.substring(0, 6) + '...');

    const clientSecret = getLinkedInClientSecret_();
    Logger.log('✅ LINKEDIN_CLIENT_SECRET is set: ' + clientSecret.substring(0, 4) + '...');

    const sheetId = getSpreadsheetId_();
    Logger.log('✅ Spreadsheet ID is set: ' + sheetId.substring(0, 10) + '...');

  } catch (propErr) {
    Logger.log('❌ Script Properties Error: ' + propErr);
    return;
  }

  // Check OAuth
  try {
    const service = getOAuthService_();
    if (service.hasAccess()) {
      Logger.log('✅ OAuth: Authorized');
    } else {
      Logger.log('❌ OAuth: NOT authorized');
      Logger.log('👉 Run showLinkedInAuthUrl() and authorize');
      return;
    }
  } catch (oauthErr) {
    Logger.log('❌ OAuth Error: ' + oauthErr);
    return;
  }

  // Check Token Validity
  if (hasValidLinkedInAccessToken_()) {
    Logger.log('✅ Access Token: Valid');
  } else {
    Logger.log('❌ Access Token: Invalid or expired');
    return;
  }

  // Check Member ID
  try {
    const memberId = getLinkedInMemberId_();
    Logger.log('✅ Member ID: ' + memberId);

    const authorUrn = getLinkedInAuthorUrn_();
    Logger.log('✅ Author URN: ' + authorUrn);

  } catch (memberErr) {
    Logger.log('❌ Member ID Error: ' + memberErr);
    return;
  }

  // Check Sheet Access
  try {
    const spreadsheetId = getSpreadsheetId_();
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheets()[0];
    const data = sheet.getDataRange().getValues();

    Logger.log('✅ Sheet Access: OK, Rows: ' + data.length);

    if (data.length > 0) {
      Logger.log('✅ Headers: ' + data[0].join(' | '));
    }

  } catch (sheetErr) {
    Logger.log('❌ Sheet Error: ' + sheetErr);
    return;
  }

  // Check Triggers
  try {
    const triggers = ScriptApp.getProjectTriggers();
    const linkedInTriggers = triggers.filter(function(t) {
      return t.getHandlerFunction() === 'publishNextLinkedInPost';
    });

    if (linkedInTriggers.length > 0) {
      Logger.log('✅ Daily Trigger: Active (' + linkedInTriggers.length + ')');
    } else {
      Logger.log('⚠️ Daily Trigger: Not set (run setupDailyLinkedInTrigger())');
    }

  } catch (triggerErr) {
    Logger.log('⚠️ Trigger Check Error: ' + triggerErr);
  }

  // Preview next post
  try {
    const preview = previewNextLinkedInPost();
    if (preview) {
      Logger.log('✅ Preview: Found next post at row ' + preview.row);
    } else {
      Logger.log('ℹ️ Preview: No unpublished posts');
    }
  } catch (previewErr) {
    Logger.log('⚠️ Preview Error: ' + previewErr);
  }

  Logger.log('====================================');
  Logger.log('Diagnostics Complete');
  Logger.log('====================================');
}

/**
 * Reset OAuth (useful for re-authorization)
 */
function resetLinkedInAuth() {
  const service = getOAuthService_();
  service.reset();

  Logger.log('LinkedIn OAuth reset. Run showLinkedInAuthUrl() to re-authorize.');
}
