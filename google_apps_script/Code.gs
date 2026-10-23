/**
 * ==============================================================================
 * โค้ด Google Apps Script สำหรับ "ตลับยาใจดี" (Kind Pillbox)
 * บันทึกประวัติการทานยาลง Google Sheets และอัปโหลดรูปซองยาเก็บใน Google Drive
 * ==============================================================================
 */

// ชื่อโฟลเดอร์ใน Google Drive สำหรับเก็บรูปซองยา
const DRIVE_FOLDER_NAME = "ตลับยาใจดี - รูปซองยา";

function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // -------------------------------------------------------------
    // กรณีที่ 1: บันทึกข้อมูลซองยาพร้อมรูปภาพลง Google Drive & Sheets
    // -------------------------------------------------------------
    if (data.action === "SAVE_PRESCRIPTION") {
      let imageUrl = "-";

      // 1.1 อัปโหลดรูปภาพลง Google Drive (ถ้ามีข้อมูล base64)
      if (data.imageBase64) {
        const folder = getOrCreateFolder(DRIVE_FOLDER_NAME);
        const cleanBase64 = data.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const decodedBytes = Utilities.base64Decode(cleanBase64);
        const fileName = "ซองยา_" + (data.drugName || "ไม่ระบุ") + "_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
        const blob = Utilities.newBlob(decodedBytes, "image/jpeg", fileName);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        imageUrl = file.getUrl();
      }

      // 1.2 บันทึกข้อมูลลง Google Sheet "ประวัติซองยา"
      let sheet = spreadsheet.getSheetByName("ประวัติซองยา");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("ประวัติซองยา");
        sheet.appendRow([
          "วันเวลาที่สแกน",
          "ชื่อผู้ป่วย",
          "ชื่อยา",
          "ขนาดยา",
          "มื้อที่ทาน",
          "ความสัมพันธ์กับอาหาร",
          "จำนวนที่ทาน",
          "คำแนะนำพิเศษ/ข้อควรระวัง",
          "ลิงก์รูปซองยาใน Google Drive"
        ]);
        sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#E8F5E9");
      }

      sheet.appendRow([
        new Date(),
        data.patientName || "ไม่ระบุ",
        data.drugName || "-",
        data.dosage || "-",
        data.slots || "-",
        data.mealRelation || "-",
        data.amount || "1 เม็ด",
        data.cautions || "-",
        imageUrl
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "บันทึกข้อมูลซองยาและรูปภาพลง Google Drive สำเร็จจ้ะ",
        imageUrl: imageUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // กรณีที่ 2: บันทึกประวัติการกดทานยาประจำวัน (Medication Intake Log)
    // -------------------------------------------------------------
    if (data.action === "LOG_TAKEN") {
      let sheet = spreadsheet.getSheetByName("ประวัติการทานยา");
      if (!sheet) {
        sheet = spreadsheet.insertSheet("ประวัติการทานยา");
        sheet.appendRow([
          "วันเวลาที่ทานจริง",
          "ชื่อผู้ป่วย",
          "มื้อยา",
          "รายการยาที่ทาน",
          "สถานะ",
          "ผู้ดูแลที่ได้รับแจ้งเตือน",
          "หมายเหตุ"
        ]);
        sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#FFF3E0");
      }

      sheet.appendRow([
        new Date(),
        data.patientName || "ไม่ระบุ",
        data.mealSlot || "-",
        data.pillsSummary || "-",
        "ทานแล้วเรียบร้อย ✓",
        data.caregiverName || "-",
        data.notes || "ตรงเวลาปกติ"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "บันทึกประวัติการทานยาลง Google Sheets สำเร็จจ้ะ"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "ไม่พบคำสั่ง action ที่ระบุ"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "ตลับยาใจดี Google Apps Script API",
    time: new Date()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * ค้นหาหรือสร้างโฟลเดอร์ใน Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}
