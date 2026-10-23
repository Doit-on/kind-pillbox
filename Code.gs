/**
 * ==============================================================================
 * โค้ด Google Apps Script สำหรับ "ตลับยาใจดี" (Kind Pillbox)
 * เชื่อมโยงกับโฟลเดอร์ Google Drive: 18wXmBCqmDW1L79cvPObIFE-Wr4cvBZdt
 * รองรับ:
 * 1. บันทึกรูปซองยาลงโฟลเดอร์ Drive ที่กำหนด
 * 2. จัดการข้อมูลยา (เพิ่ม / แก้ไข / ลบ / ดึงรายการยาทั้งหมด) ทำงานร่วมกับแอปแบบสองทาง
 * 3. บันทึก Log การกินยา และการลืมกินยา พร้อมเวลาที่กำหนดและเวลาที่กินจริง
 * ==============================================================================
 */

// โฟลเดอร์ Google Drive ที่ผู้ใช้กำหนด
const TARGET_FOLDER_ID = "18wXmBCqmDW1L79cvPObIFE-Wr4cvBZdt";

// ชื่อแท็บใน Google Sheets
const SHEET_MEDS = "รายการยาในตลับ";
const SHEET_LOGS = "บันทึกการกินยาและลืมยา";

/**
 * จัดการคำขอแบบ GET (ดึงข้อมูลรายการยา และบันทึกประวัติ)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // 1. ดึงรายการยาทั้งหมดเพื่อไปแสดงในแอป
    if (action === "GET_MEDICATIONS") {
      const sheet = getOrCreateMedsSheet(spreadsheet);
      const data = sheet.getDataRange().getValues();
      const medications = [];

      // ข้ามหัวตาราง (แถวที่ 1)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) { // มี medId
          medications.push({
            id: row[0],
            name: row[1],
            dosage: row[2],
            slot: row[3], // morning, noon, evening, bedtime
            mealRelation: row[4],
            amount: row[5],
            advice: row[6],
            imageUrl: row[7],
            pillColorShape: row[8] || "💊",
            updatedAt: row[9]
          });
        }
      }

      return createJsonResponse({ success: true, medications: medications });
    }

    // 2. ดึงประวัติ Log ล่าสุด
    if (action === "GET_LOGS") {
      const sheet = getOrCreateLogsSheet(spreadsheet);
      const data = sheet.getDataRange().getValues();
      const logs = [];

      for (let i = Math.max(1, data.length - 30); i < data.length; i++) {
        const row = data[i];
        logs.push({
          timestamp: row[0],
          patientName: row[1],
          mealSlot: row[2],
          pillsSummary: row[3],
          scheduledTime: row[4],
          actualTime: row[5],
          status: row[6],
          delayHours: row[7],
          adviceGiven: row[8],
          caregiverNotified: row[9]
        });
      }

      return createJsonResponse({ success: true, logs: logs });
    }

    return createJsonResponse({
      status: "online",
      service: "ตลับยาใจดี Google Apps Script API",
      folderId: TARGET_FOLDER_ID,
      time: new Date()
    });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * จัดการคำขอแบบ POST (เพิ่มยา, แก้ไขยา, ลบยา, และจด Log การกินยา/ลืมกินยา)
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // --------------------------------------------------------------------------
    // ACTION 1: บันทึกซองยาใหม่ / เพิ่มยาเข้าตลับยา (ADD_MEDICATION / SAVE_PRESCRIPTION)
    // --------------------------------------------------------------------------
    if (data.action === "SAVE_PRESCRIPTION" || data.action === "ADD_MEDICATION") {
      let imageUrl = "-";

      // อัปโหลดรูปลง Google Drive Folder ที่กำหนด
      if (data.imageBase64) {
        imageUrl = saveImageToDrive(data.imageBase64, data.drugName);
      }

      const sheet = getOrCreateMedsSheet(spreadsheet);
      const medId = "med_" + new Date().getTime();
      const nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

      sheet.appendRow([
        medId,
        data.drugName || "ไม่ระบุชื่อยา",
        data.dosage || "-",
        data.slot || "morning", // morning, noon, evening, bedtime
        data.mealRelation || "หลังอาหาร",
        data.amount || "ครั้งละ 1 เม็ด",
        data.cautions || data.advice || "-",
        imageUrl,
        data.pillColorShape || "💊",
        nowStr
      ]);

      return createJsonResponse({
        success: true,
        message: "เพิ่มยาลงตลับและ Google Sheet เรียบร้อยจ้ะ",
        medId: medId,
        imageUrl: imageUrl
      });
    }

    // --------------------------------------------------------------------------
    // ACTION 2: แก้ไขข้อมูลยา (UPDATE_MEDICATION)
    // --------------------------------------------------------------------------
    if (data.action === "UPDATE_MEDICATION") {
      const sheet = getOrCreateMedsSheet(spreadsheet);
      const values = sheet.getDataRange().getValues();
      let foundRow = -1;

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          foundRow = i + 1; // 1-based index
          break;
        }
      }

      if (foundRow > 0) {
        if (data.name) sheet.getRange(foundRow, 2).setValue(data.name);
        if (data.dosage) sheet.getRange(foundRow, 3).setValue(data.dosage);
        if (data.slot) sheet.getRange(foundRow, 4).setValue(data.slot);
        if (data.mealRelation) sheet.getRange(foundRow, 5).setValue(data.mealRelation);
        if (data.amount) sheet.getRange(foundRow, 6).setValue(data.amount);
        if (data.advice) sheet.getRange(foundRow, 7).setValue(data.advice);
        if (data.pillColorShape) sheet.getRange(foundRow, 9).setValue(data.pillColorShape);
        sheet.getRange(foundRow, 10).setValue(Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"));

        return createJsonResponse({ success: true, message: "แก้ไขข้อมูลยาในตลับเรียบร้อยแล้วจ้ะ" });
      } else {
        return createJsonResponse({ success: false, message: "ไม่พบรหัสยานี้ในตารางจ้ะ" });
      }
    }

    // --------------------------------------------------------------------------
    // ACTION 3: ลบยาออกจากตลับยา (DELETE_MEDICATION)
    // --------------------------------------------------------------------------
    if (data.action === "DELETE_MEDICATION") {
      const sheet = getOrCreateMedsSheet(spreadsheet);
      const values = sheet.getDataRange().getValues();
      let foundRow = -1;

      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sheet.deleteRow(foundRow);
        return createJsonResponse({ success: true, message: "ลบยาออกจากตลับและ Google Sheet เรียบร้อยแล้วจ้ะ" });
      } else {
        return createJsonResponse({ success: false, message: "ไม่พบรหัสยาที่ต้องการลบจ้ะ" });
      }
    }

    // --------------------------------------------------------------------------
    // ACTION 4: บันทึก Log การกินยา และการลืมกินยา (LOG_TAKEN / LOG_MISSED)
    // --------------------------------------------------------------------------
    if (data.action === "LOG_TAKEN" || data.action === "LOG_MISSED") {
      const sheet = getOrCreateLogsSheet(spreadsheet);
      const now = new Date();

      sheet.appendRow([
        Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss"),
        data.patientName || "คุณตาประเสริฐ",
        data.mealSlot || "-",
        data.pillsSummary || "-",
        data.scheduledTime || "-",
        data.action === "LOG_MISSED" ? "ไม่ได้ทาน / ข้ามมื้อ" : Utilities.formatDate(now, "GMT+7", "HH:mm:ss"),
        data.status || (data.action === "LOG_MISSED" ? "ลืมกินยา" : "กินตรงเวลา"),
        data.delayHours || "0 ชม.",
        data.adviceGiven || "-",
        data.caregiverName || "-"
      ]);

      return createJsonResponse({
        success: true,
        message: "บันทึกประวัติการกินยาลง Google Sheet เรียบร้อยแล้วจ้ะ"
      });
    }

    return createJsonResponse({ success: false, message: "ไม่พบคำสั่ง action ที่ระบุ" });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

function saveImageToDrive(base64Data, drugName) {
  try {
    const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const decodedBytes = Utilities.base64Decode(cleanBase64);
    const fileName = "ซองยา_" + (drugName || "ยา") + "_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
    const blob = Utilities.newBlob(decodedBytes, "image/jpeg", fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "เกิดข้อผิดพลาดในการบันทึกภาพ: " + e.toString();
  }
}

function getOrCreateMedsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_MEDS);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_MEDS);
    sheet.appendRow([
      "รหัสยา (ID)",
      "ชื่อยา",
      "ขนาดยา (mg)",
      "มื้อยา (morning/noon/evening/bedtime)",
      "ความสัมพันธ์กับอาหาร",
      "จำนวนที่ทาน",
      "คำแนะนำพิเศษ/ข้อควรระวัง",
      "ลิงก์รูปซองยาใน Google Drive",
      "ไอคอน/สีเม็ดยา",
      "อัปเดตล่าสุด"
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#E8F5E9");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateLogsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_LOGS);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_LOGS);
    sheet.appendRow([
      "วันเวลาที่บันทึก",
      "ชื่อผู้ป่วย",
      "มื้อยา",
      "รายการยาที่ทาน",
      "เวลาที่ควรทานตามตาราง",
      "เวลาที่ทานจริง",
      "สถานะการทานยา",
      "ระยะเวลาที่ล่าช้า",
      "คำแนะนำที่ระบบให้",
      "ผู้ดูแลที่ได้รับแจ้งเตือน"
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#FFF3E0");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
