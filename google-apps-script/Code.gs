/** TABUNGANKU v2.0 - Google Sheets + Drive backend.
 * Jalankan setupTabunganku() sekali dari editor Apps Script.
 * Deploy sebagai Web app: Execute as Me, access Anyone.
 * Endpoint dilindungi shared secret yang hanya disimpan di Script Properties
 * dan Cloudflare Pages Secret, bukan di frontend.
 */
const APP_NAME = 'TABUNGANKU';
const PROP = PropertiesService.getScriptProperties();
const SHEET_GOALS = 'MASTER_TABUNGAN';
const SHEET_TX = 'TRANSAKSI';
const SHEET_META = 'APP_META';

function setupTabunganku() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Buka Apps Script dari Google Spreadsheet TABUNGANKU.');
  ss.setSpreadsheetTimeZone('Asia/Jakarta');
  ensureSheet_(ss, SHEET_GOALS, ['id','name','icon','color','target','balance','target_date','monthly_plan','term','note','updated_at']);
  ensureSheet_(ss, SHEET_TX, ['id','goal_id','type','amount','date','note','created_at']);
  const meta = ensureSheet_(ss, SHEET_META, ['key','value']);
  if (!PROP.getProperty('API_SECRET')) {
    const secret = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
    PROP.setProperty('API_SECRET', secret);
    Logger.log('COPY THIS ONCE TO CLOUDFLARE SECRET GAS_API_SECRET: ' + secret);
  }
  if (!PROP.getProperty('SPREADSHEET_ID')) PROP.setProperty('SPREADSHEET_ID', ss.getId());
  if (!metaValue_(meta, 'revision')) setMeta_(meta, 'revision', '0');
  if (!metaValue_(meta, 'updated_at')) setMeta_(meta, 'updated_at', '');
  installWeeklyBackupTrigger_();
  Logger.log('Setup complete. Spreadsheet: ' + ss.getUrl());
  Logger.log('Copy API_SECRET from this execution log into Cloudflare Pages secret GAS_API_SECRET.');
}

function doGet() {
  return json_({ok:false, error:'Use POST through the Cloudflare app endpoint.'});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PROP.getProperty('API_SECRET');
    if (!expected || !constantTimeEqual_(String(body.token || ''), expected)) return json_({ok:false,error:'Unauthorized'});
    const ssId = PROP.getProperty('SPREADSHEET_ID');
    if (!ssId) throw new Error('Jalankan setupTabunganku() terlebih dahulu.');
    const ss = SpreadsheetApp.openById(ssId);
    const action = String(body.action || '');
    if (action === 'get') return json_({ok:true, state:readState_(ss)});
    if (action === 'save') return json_(saveState_(ss, body.payload || {}));
    if (action === 'backup') return json_({ok:true, backup:backupNow_()});
    if (action === 'health') return json_({ok:true, app:APP_NAME, spreadsheet:ss.getName(), revision:Number(metaValue_(ss.getSheetByName(SHEET_META),'revision') || 0)});
    return json_({ok:false,error:'Unknown action'});
  } catch (err) {
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function readState_(ss) {
  const goals = rowsAsObjects_(ss.getSheetByName(SHEET_GOALS)).map(r => ({
    id:toId_(r.id), name:String(r.name||''), icon:String(r.icon||'🎯'), color:String(r.color||'#edf4ef'),
    target:Number(r.target||0), balance:Number(r.balance||0), date:String(r.target_date||''),
    monthly:Number(r.monthly_plan||0), term:String(r.term||'short'), note:String(r.note||'')
  }));
  const transactions = rowsAsObjects_(ss.getSheetByName(SHEET_TX)).map(r => ({
    id:toId_(r.id), goalId:toId_(r.goal_id), type:String(r.type||''), amount:Number(r.amount||0),
    date:formatDate_(r.date), note:String(r.note||'')
  })).reverse();
  const meta = ss.getSheetByName(SHEET_META);
  return {goals, transactions, revision:Number(metaValue_(meta,'revision')||0), updatedAt:metaValue_(meta,'updated_at')||''};
}

function saveState_(ss, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const meta = ss.getSheetByName(SHEET_META);
    const current = Number(metaValue_(meta,'revision') || 0);
    const base = Number(payload.baseRevision || 0);
    if (base !== current) return {ok:false, conflict:true, error:'Data di server berubah sejak sinkronisasi terakhir.', state:readState_(ss)};
    const goals = Array.isArray(payload.goals) ? payload.goals : [];
    const tx = Array.isArray(payload.transactions) ? payload.transactions : [];
    const goalRows = [['id','name','icon','color','target','balance','target_date','monthly_plan','term','note','updated_at']];
    goals.forEach(g => goalRows.push([String(g.id),String(g.name||''),String(g.icon||'🎯'),String(g.color||'#edf4ef'),Number(g.target||0),Number(g.balance||0),String(g.date||''),Number(g.monthly||0),String(g.term||'short'),String(g.note||''),new Date()]));
    const txRows = [['id','goal_id','type','amount','date','note','created_at']];
    tx.forEach(t => txRows.push([String(t.id),String(t.goalId),String(t.type||''),Number(t.amount||0),String(t.date||''),String(t.note||''),new Date()]));
    replaceSheet_(ss.getSheetByName(SHEET_GOALS), goalRows);
    replaceSheet_(ss.getSheetByName(SHEET_TX), txRows);
    const next = current + 1;
    setMeta_(meta,'revision',String(next));
    setMeta_(meta,'updated_at',new Date().toISOString());
    return {ok:true, revision:next, updatedAt:new Date().toISOString()};
  } finally { lock.releaseLock(); }
}

function backupNow_() {
  const ssId = PROP.getProperty('SPREADSHEET_ID');
  const file = DriveApp.getFileById(ssId);
  const folderId = PROP.getProperty('BACKUP_FOLDER_ID');
  let folder = folderId ? DriveApp.getFolderById(folderId) : null;
  if (!folder) {
    folder = DriveApp.createFolder('TABUNGANKU Backups');
    PROP.setProperty('BACKUP_FOLDER_ID', folder.getId());
  }
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd_HHmm');
  const copy = file.makeCopy('TABUNGANKU_Backup_' + stamp, folder);
  return {fileName:copy.getName(), folderUrl:folder.getUrl(), fileUrl:copy.getUrl()};
}

function installWeeklyBackupTrigger_() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'weeklyBackup').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('weeklyBackup').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
}
function weeklyBackup() { backupNow_(); }
function ensureSheet_(ss,name,headers) { let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name); if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]); sh.setFrozenRows(1); return sh; }
function replaceSheet_(sh, rows) { sh.clearContents(); sh.getRange(1,1,rows.length,rows[0].length).setValues(rows); sh.setFrozenRows(1); }
function rowsAsObjects_(sh) { if(!sh || sh.getLastRow()<2) return []; const v=sh.getDataRange().getValues(), h=v.shift(); return v.filter(r=>r.some(c=>c!==''&&c!==null)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]]))); }
function metaValue_(sh,key) { const vals=sh.getDataRange().getValues(); for(let i=1;i<vals.length;i++) if(vals[i][0]===key) return String(vals[i][1]); return ''; }
function setMeta_(sh,key,value) { const vals=sh.getDataRange().getValues(); for(let i=1;i<vals.length;i++) if(vals[i][0]===key){sh.getRange(i+1,2).setValue(value);return;} sh.appendRow([key,value]); }
function toId_(v) { const n=Number(v); return Number.isFinite(n) ? n : String(v||''); }
function formatDate_(v) { if(v instanceof Date) return Utilities.formatDate(v,'Asia/Jakarta','yyyy-MM-dd'); return String(v||'').slice(0,10); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function constantTimeEqual_(a,b) { if(a.length!==b.length) return false; let out=0; for(let i=0;i<a.length;i++) out|=a.charCodeAt(i)^b.charCodeAt(i); return out===0; }
