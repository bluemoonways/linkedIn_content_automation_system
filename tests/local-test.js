/**
 * LinkedIn Auto Poster - Offline Test Harness
 * 56 checks - Node.js
 * Run: node tests/local-test.js
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function check(description, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${description}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${description} - ${err.message}`);
    failed++;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

// Load files if exist
let codeGs = '';
let manifestRaw = '';
let manifest = null;
let readme = '';
let setup = '';

if (fileExists('Code.gs')) codeGs = readFile('Code.gs');
if (fileExists('appsscript.json')) {
  manifestRaw = readFile('appsscript.json');
  try { manifest = JSON.parse(manifestRaw); } catch (e) { manifest = null; }
}
if (fileExists('README.md')) readme = readFile('README.md');
if (fileExists('SETUP.md')) setup = readFile('SETUP.md');

console.log('====================================');
console.log('🔍 LinkedIn Auto Poster - Local Tests');
console.log('====================================\n');

// 1-5 File existence
check('1. Code.gs exists', () => fileExists('Code.gs'));
check('2. appsscript.json exists', () => fileExists('appsscript.json'));
check('3. README.md exists', () => fileExists('README.md'));
check('4. SETUP.md exists', () => fileExists('SETUP.md'));
check('5. tests folder exists', () => fileExists('tests'));

// 6-7 Portfolio
check('6. Code.gs contains PORTFOLIO_LINK_ constant', () => codeGs.includes('PORTFOLIO_LINK_'));
check('7. Code.gs contains portfolio URL https://bluemoonways.vercel.app/', () => codeGs.includes('https://bluemoonways.vercel.app/'));

// 8-12 OAuth & Config basics
check('8. Code.gs contains getOAuthService_ function', () => codeGs.includes('function getOAuthService_'));
check('9. Code.gs contains OAuth2.createService', () => codeGs.includes('OAuth2.createService'));
check('10. Code.gs handles LINKEDIN_CLIENT_ID via ScriptProperties', () => codeGs.includes('LINKEDIN_CLIENT_ID'));
check('11. Code.gs handles LINKEDIN_CLIENT_SECRET via ScriptProperties', () => codeGs.includes('LINKEDIN_CLIENT_SECRET'));
check('12. Code.gs contains getSpreadsheetId_ function', () => codeGs.includes('function getSpreadsheetId_'));

// 13-22 Auth & Member functions
check('13. Code.gs contains getAccessToken_ function', () => codeGs.includes('function getAccessToken_'));
check('14. Code.gs contains isLinkedInAuthorized_ function', () => codeGs.includes('function isLinkedInAuthorized_'));
check('15. Code.gs contains hasValidLinkedInAccessToken_ function', () => codeGs.includes('function hasValidLinkedInAccessToken_'));
check('16. Code.gs contains showLinkedInAuthUrl function', () => codeGs.includes('function showLinkedInAuthUrl'));
check('17. Code.gs contains authCallback function', () => codeGs.includes('function authCallback'));
check('18. Code.gs contains doGet function for webapp callback', () => codeGs.includes('function doGet'));
check('19. Code.gs contains getLinkedInMemberId_ function', () => codeGs.includes('function getLinkedInMemberId_'));
check('20. Code.gs contains getLinkedInAuthorUrn_ function', () => codeGs.includes('function getLinkedInAuthorUrn_'));
check('21. Code.gs contains getDriveFileIdFromUrl_ function', () => codeGs.includes('function getDriveFileIdFromUrl_'));
check('22. Code.gs contains getImageBlobFromDrive_ function', () => codeGs.includes('function getImageBlobFromDrive_'));

// 23-32 Core posting & triggers
check('23. Code.gs contains uploadImageToLinkedIn_ function', () => codeGs.includes('function uploadImageToLinkedIn_'));
check('24. Code.gs contains postToLinkedIn_ function', () => codeGs.includes('function postToLinkedIn_'));
check('25. Code.gs contains publishNextLinkedInPost function', () => codeGs.includes('function publishNextLinkedInPost'));
check('26. Code.gs contains previewNextLinkedInPost function', () => codeGs.includes('function previewNextLinkedInPost'));
check('27. Code.gs contains testLinkedInPost function', () => codeGs.includes('function testLinkedInPost'));
check('28. Code.gs contains setupDailyLinkedInTrigger function', () => codeGs.includes('function setupDailyLinkedInTrigger'));
check('29. Code.gs contains removeDailyLinkedInTrigger function', () => codeGs.includes('function removeDailyLinkedInTrigger'));
check('30. Code.gs contains diagnoseLinkedInSetup function', () => codeGs.includes('function diagnoseLinkedInSetup'));
check('31. Code.gs contains checkLinkedInAuthorization function', () => codeGs.includes('function checkLinkedInAuthorization'));
check('32. Code.gs contains resetLinkedInAuth function', () => codeGs.includes('function resetLinkedInAuth'));

// 33-42 API endpoints & patterns
check('33. Code.gs contains LinkedIn Posts API endpoint /rest/posts', () => codeGs.includes('api.linkedin.com/rest/posts'));
check('34. Code.gs contains LinkedIn Images API endpoint /rest/images', () => codeGs.includes('api.linkedin.com/rest/images'));
check('35. Code.gs contains LinkedIn userinfo endpoint /v2/userinfo', () => codeGs.includes('api.linkedin.com/v2/userinfo'));
check('36. Code.gs contains initializeUpload for image upload', () => codeGs.includes('initializeUpload'));
check('37. Code.gs contains LINKEDIN_API_VERSION_ constant', () => codeGs.includes('LINKEDIN_API_VERSION_'));
check('38. Code.gs uses LockService.getScriptLock for concurrency', () => codeGs.includes('LockService.getScriptLock'));
check('39. Code.gs uses ScriptApp.newTrigger for daily scheduling', () => codeGs.includes('ScriptApp.newTrigger'));
check('40. Code.gs uses PropertiesService.getScriptProperties', () => codeGs.includes('PropertiesService.getScriptProperties'));
check('41. Code.gs uses PropertiesService.getUserProperties for OAuth', () => codeGs.includes('PropertiesService.getUserProperties'));
check('42. Code.gs requests w_member_social scope', () => codeGs.includes('w_member_social'));

// 43-44 Safety checks
check('43. Code.gs does NOT contain hardcoded real client secret (no direct assignment of long secret)', () => {
  // Look for suspicious hardcoded secret pattern: client_secret = "longString"
  const suspicious = /client_secret\s*[:=]\s*["'][A-Za-z0-9\-_]{20,}["']/i.test(codeGs);
  // Also check for docs link with real spreadsheet ID hardcoded (should use getProperty)
  const hardcodedSheetId = /spreadsheets\/d\/[a-zA-Z0-9-_]{20,}/.test(codeGs);
  // Our code should NOT have those hardcoded; it uses getProperty
  return !suspicious && !hardcodedSheetId;
});
check('44. Code.gs contains secure error message for missing CLIENT_ID', () => codeGs.includes('LINKEDIN_CLIENT_ID not set'));

// 45-52 Manifest checks
check('45. appsscript.json is valid JSON', () => manifest !== null);
check('46. appsscript.json has OAuth2 libraryId 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY', () => {
  if (!manifest || !manifest.dependencies || !manifest.dependencies.libraries) return false;
  return manifest.dependencies.libraries.some(lib => lib.libraryId === '1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY');
});
check('47. appsscript.json OAuth2 library version is 43', () => {
  if (!manifest || !manifest.dependencies || !manifest.dependencies.libraries) return false;
  const lib = manifest.dependencies.libraries.find(l => l.libraryId === '1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDFY');
  return lib && String(lib.version) === '43';
});
check('48. appsscript.json has timeZone Asia/Karachi', () => manifest && manifest.timeZone === 'Asia/Karachi');
check('49. appsscript.json has runtimeVersion V8', () => manifest && manifest.runtimeVersion === 'V8');
check('50. appsscript.json has oauthScopes including spreadsheets', () => {
  if (!manifest || !manifest.oauthScopes) return false;
  return manifest.oauthScopes.some(s => s.includes('spreadsheets'));
});
check('51. appsscript.json has oauthScopes including drive.readonly', () => {
  if (!manifest || !manifest.oauthScopes) return false;
  return manifest.oauthScopes.some(s => s.includes('drive.readonly'));
});
check('52. appsscript.json has webapp config with USER_ACCESSING', () => {
  if (!manifest || !manifest.webapp) return false;
  return manifest.webapp.executeAs === 'USER_ACCESSING';
});

// 53-56 README & SETUP
check('53. README.md contains LinkedIn Auto Poster title', () => readme.includes('LinkedIn Auto Poster'));
check('54. README.md contains portfolio link https://bluemoonways.vercel.app/', () => readme.includes('https://bluemoonways.vercel.app/'));
check('55. SETUP.md contains troubleshooting / setup steps', () => setup.toLowerCase().includes('troubleshooting') || setup.toLowerCase().includes('setup'));
check('56. SETUP.md mentions LinkedIn Developer App', () => setup.toLowerCase().includes('linkedin') && setup.toLowerCase().includes('developer'));

console.log('\n====================================');
console.log(`RESULT: ${passed} passed, ${failed} failed`);
console.log('====================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
