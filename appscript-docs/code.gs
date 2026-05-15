// code.gs
function doGet() {
  initSpreadsheetStructure();
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://gsheets.vn/wp-content/uploads/2024/05/cropped-EMS-3.png')
    .setTitle('Trang Quản Lý Báo Cáo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initSpreadsheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsConfig = {
    'PHIEU_CAN': ['STT', 'SO_PHIEU', 'BIEN_SO', 'KHACH_HANG', 'LOAI_HANG', 'TL_CAN_LAN_1', 'TL_CAN_LAN_2', 'TRU_BI', 'TL_HANG', 'NGAY_CAN_1', 'GIO_CAN_1', 'NGAY_CAN_2', 'GIO_CAN_2', 'KHO_HANG', 'GHI_CHU', 'HAM_SO', 'TRANG_THAI', 'TEN_NV', 'TAI_KHOAN', 'THOI_GIAN'],
    'TALLY_CHECK': ['STT', 'SO_PHIEU', 'BIEN_SO', 'KHACH_HANG', 'LOAI_HANG', 'TL_CAN_LAN_1', 'TL_CAN_LAN_2', 'TRU_BI', 'TL_HANG', 'NGAY_CAN_1', 'GIO_CAN_1', 'NGAY_CAN_2', 'GIO_CAN_2', 'KHO_HANG', 'GHI_CHU', 'HAM_SO', 'TRANG_THAI', 'TEN_NV', 'TAI_KHOAN', 'THOI_GIAN', 'CA', 'TALLY_NOTE', 'MINH_CHUNG', 'CHECKED_BY', 'CHECKED_TIME'],
    'BC_NHANH': ['HẦM SỐ', 'XE CONT', 'XE THÙNG', 'TỔNG XE', 'SAO VÀNG', 'NINH TÂY', 'KRÔNG BÔNG', ' KHÁNH ĐÔNG', 'TỔNG KH', 'KẾ HOẠCH', 'CHÊNH LỆCH', 'TIẾN ĐỘ %'],
    'DS_XE': ['STT', 'BIỂN SỐ', 'ĐƠN VỊ', 'LOẠI XE', 'TÀI XẾ', 'ĐIỆN THOẠI', 'ĐƠN GIÁ', 'GHI CHÚ'],
    'User': ['ID', 'TÊN', 'EMAIL', 'PASS', 'ẢNH', 'ROLE'],
    'AUDIT_LOGS': ['ID', 'NGƯỜI DÙNG', 'VAI TRÒ', 'HÀNH ĐỘNG', 'THỰC THỂ', 'ID THỰC THỂ', 'THỜI GIAN'],
    'INCIDENTS': ['THỜI GIAN', 'NGƯỜI GỬI', 'LOẠI', 'MÔ TẢ', 'LINK FILE', 'BIỂN SỐ/SỐ PHIẾU'],
    'SETTINGS': ['KEY', 'VALUE']
  };

  for (let name in sheetsConfig) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheetsConfig[name]);
      sheet.getRange(1, 1, 1, sheetsConfig[name].length).setFontWeight("bold").setBackground("#d1d5db");
      sheet.setFrozenRows(1);
    }
  }

  // Initial settings if empty
  let settingsSheet = ss.getSheetByName('SETTINGS');
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.appendRows([
      ['vessel_name', 'SNOW CAMELLIA'],
      ['voyage', 'V.52'],
      ['hold_1_target', '0'],
      ['hold_2_target', '0'],
      ['hold_3_target', '0'],
      ['hold_4_target', '0'],
      ['hold_5_target', '0'],
      ['hold_6_target', '0'],
      ['Total', '10000']
    ]);
  }

  // Ensure default user if User sheet is empty
  let userSheet = ss.getSheetByName('User');
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow(['1', 'Admin', 'admin@tallyport.vn', '123456', '', 'Admin']);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function authenticate(username, password) {
  var userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('User');
  var dataRange = userSheet.getDataRange();
  var values = dataRange.getValues();
  
  for (var i = 1; i < values.length; i++) {
    var storedEmail = values[i][2];
    var storedPassword = values[i][3];
    var role = values[i][5];
    
    if (storedEmail && storedEmail.toString().trim() === username.trim() && 
        storedPassword && storedPassword.toString().trim() === password.trim()) {
      return role === "Admin" ? 'admin' : 'user';
    }
  }
  return 'invalid';
}

function validateLogin(username, password) {
  return authenticate(username, password);
}

function getSheetData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      console.error("Sheet không tồn tại:", sheetName);
      return null;
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    console.log("Sheet:", sheetName, "Rows total:", values.length);
    
    if (values.length <= 1) return [];
    
    // Lọc bỏ hàng rỗng triệt để hơn
    const filtered = values.slice(1).filter(row => {
      return row.some(cell => {
        if (cell === null || cell === undefined) return false;
        const s = String(cell).trim();
        return s !== "";
      });
    });
    
    console.log("Sheet:", sheetName, "Rows after filter:", filtered.length);
    return filtered;
  } catch (e) {
    console.error("Lỗi getSheetData (" + sheetName + "):", e.message);
    return null;
  }
}

function getRowData(sheetName, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    return sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  } catch (e) {
    return null;
  }
}

function updateRowInSheet(sheetName, rowIndex, values, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Đợi tối đa 10 giây
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet không tồn tại");
    sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
    
    addAuditLog(userEmail || "Unknown", "UPDATE", sheetName, rowIndex, JSON.stringify(values));
    
    return "Cập nhật thành công";
  } catch (e) {
    throw new Error(e.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteRowFromSheet(sheetName, rowIndex, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet không tồn tại");
    
    const oldData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.deleteRow(rowIndex);
    
    addAuditLog(userEmail || "Unknown", "DELETE", sheetName, rowIndex, JSON.stringify(oldData));
    
    return "Xóa thành công";
  } catch (e) {
    throw new Error(e.message);
  } finally {
    lock.releaseLock();
  }
}

function getSelectedRow(sheetName, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    return sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  } catch (e) {
    return null;
  }
}

function uploadIncidentFile(obj) {
  const lock = LockService.getScriptLock();
  try {
    if (!obj) {
      throw new Error("Dữ liệu gửi lên bị trống (Payload empty)");
    }
    
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('INCIDENTS');
    if (!sheet) {
      sheet = ss.insertSheet('INCIDENTS');
      sheet.appendRow(['THỜI GIAN', 'NGƯỜI GỬI', 'LOẠI', 'MÔ TẢ', 'LINK FILE', 'BIỂN SỐ/SỐ PHIẾU']);
    }

    let fileUrl = "Không có file";
    if (obj.fileData) {
      try {
        const folderName = 'TallyPort_Incidents';
        let folder;
        const folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }

        // Tách header và dữ liệu Base64
        const parts = obj.fileData.split(",");
        if (parts.length < 2) throw new Error("Định dạng file không hợp lệ");
        
        const contentType = parts[0].substring(parts[0].indexOf(":") + 1, parts[0].indexOf(";"));
        const bytes = Utilities.base64Decode(parts[1]);
        const blob = Utilities.newBlob(bytes, contentType, obj.fileName || ("incident_" + Date.now()));
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      } catch (driveErr) {
        fileUrl = "Lỗi Drive: " + driveErr.message;
      }
    }

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, obj.user || "Unknown", obj.type || "Sự cố", obj.description || "-", fileUrl, obj.ref || "-"]);
    
    addAuditLog(obj.user || "Unknown", "INCIDENT_REPORT", "INCIDENTS", "-", "Báo sự cố. File: " + fileUrl);
    
    return "Gửi báo cáo thành công!";
  } catch (e) {
    throw new Error("Lỗi hệ thống: " + e.message);
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // Bỏ qua nếu lock đã được giải phóng hoặc không được thiết lập
    }
  }
}

function uploadTallyMedia(obj) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('TALLY_CHECK');
    if (!sheet) throw new Error("Không tìm thấy bảng TALLY_CHECK");

    let fileUrl = "";
    if (obj.fileData) {
      const folderName = 'TallyPort_Evidence';
      let folder;
      try {
        const folders = DriveApp.getFoldersByName(folderName);
        folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      } catch(fErr) {
        folder = DriveApp.getRootFolder(); // Fallback nếu lỗi tạo folder
      }

      const parts = obj.fileData.split(",");
      if (parts.length < 2) throw new Error("Chưa có hoặc dữ liệu file tải lên bị lỗi!");
      const contentType = parts[0].substring(parts[0].indexOf(":") + 1, parts[0].indexOf(";"));
      const bytes = Utilities.base64Decode(parts[1]);
      const blob = Utilities.newBlob(bytes, contentType, obj.fileName || ("tally_" + Date.now()));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }

    // Ghi vào cột MINH_CHUNG (Cột W - 23)
    const rowIndex = parseInt(obj.rowIdx);
    sheet.getRange(rowIndex, 23).setValue(fileUrl);
    
    addAuditLog(obj.user || "Unknown", "UPLOAD_MEDIA", "TALLY_CHECK", rowIndex, "Tải lên minh chứng: " + fileUrl);
    return "Tải lên thành công!";
  } catch (e) {
    throw new Error("Lỗi tải file: " + e.message);
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function updateTallyField(obj) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) throw new Error("Hệ thống đang bận. Vui lòng thử lại sau.");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('TALLY_CHECK');
    if (!sheet) throw new Error("Không tìm thấy bảng TALLY_CHECK");

    const rowIdx = parseInt(obj.rowIdx);
    const colIdx = parseInt(obj.colIdx);
    const value = obj.value;

    sheet.getRange(rowIdx, colIdx).setValue(value);
    
    addAuditLog(obj.user || "Unknown", "QUICK_UPDATE", "TALLY_CHECK", rowIdx, `Cập nhật cột ${colIdx} thành: ${value}`);
    
    const telegramToken = "8702845729:AAGROiJGHoY9pu5SEl6CYReCodzD6F5d6AU"; 
    const chatId = "-1003937677378";         
    if (telegramToken.indexOf("YOUR") === -1) {
       let fieldName = colIdx === 16 ? "HẦM" : (colIdx === 21 ? "CA" : "GHI CHÚ");
       let msg = `🚛 *CẬP NHẬT TALLY*\n` +
                 `--------------------------\n` +
                 `🔑 *Số phiếu:* ${obj.soPhieu}\n` +
                 `📋 *Biển số:* ${obj.bienSo || "---"}\n` +
                 `🔹 *${fieldName}:* ${value}\n` +
                 `👤 *Nhân viên:* ${obj.user}\n` +
                 `⏰ *Lúc:* ${new Date().toLocaleTimeString('vi-VN')}`;
       sendToTelegram(telegramToken, chatId, msg);
    }
    
    return "Đã lưu!";
  } catch (e) {
    throw new Error(e.message);
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function getDashboardSummary() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tallySheet = ss.getSheetByName('TALLY_CHECK');
    const bcSheet = ss.getSheetByName('BC_NHANH');
    
    let summary = {
      totalTrucks: 0,
      totalTons: 0,
      totalPercent: 0,
      incidents: 0,
      cargoCompanies: {
        'SAO VÀNG': 0,
        'NINH TÂY': 0,
        'KRÔNG BÔNG': 0,
        'KHÁNH ĐÔNG': 0
      },
      progress: []
    };

    if (tallySheet) {
      const data = tallySheet.getDataRange().getValues();
      summary.totalTrucks = Math.max(0, data.length - 1);
      for(let i=1; i<data.length; i++) {
        summary.totalTons += (Number(data[i][8]) || 0);
      }
    }

    if (bcSheet && bcSheet.getLastRow() > 1) {
      const bcData = bcSheet.getRange(2, 1, bcSheet.getLastRow()-1, 12).getValues();
      let totalP = 0;
      bcData.forEach(row => {
        const p = parseFloat(row[11]) || 0;
        totalP += p;
        summary.progress.push({
          ham: row[0],
          plan: row[9],
          tons: row[8],
          percent: p
        });
        
        // Sum by companies
        summary.cargoCompanies['SAO VÀNG'] += (parseFloat(row[4]) || 0);
        summary.cargoCompanies['NINH TÂY'] += (parseFloat(row[5]) || 0);
        summary.cargoCompanies['KRÔNG BÔNG'] += (parseFloat(row[6]) || 0);
        summary.cargoCompanies['KHÁNH ĐÔNG'] += (parseFloat(row[7]) || 0);
      });
      summary.totalPercent = summary.progress.length > 0 ? Math.round(totalP / summary.progress.length) : 0;
    }

    return summary;
  } catch (e) {
    return { error: e.message };
  }
}

function sendFullReportTelegram(user) {
  const summary = getDashboardSummary();
  if (!summary || summary.error) return "Không có dữ liệu báo cáo: " + (summary?.error || "");
  
  const telegramToken = "8702845729:AAGROiJGHoY9pu5SEl6CYReCodzD6F5d6AU"; 
  const chatId = "-1003937677378";
  
  let reportBody = `📊 *BÁO CÁO TỔNG HỢP CẢNG*\n` +
                   `📅 Ngày: ${new Date().toLocaleDateString('vi-VN')}\n` +
                   `--------------------------\n` +
                   `🏗️ *Tiến độ tổng:* ${summary.totalPercent}%\n` +
                   `🚛 *Tổng lượt xe:* ${summary.totalTrucks}\n` +
                   `⚖️ *Tổng sản lượng:* ${summary.totalTons.toLocaleString()} tấn\n\n` +
                   `*SẢN LƯỢNG THEO ĐƠN VỊ:*\n` +
                   `🏢 SAO VÀNG: ${summary.cargoCompanies['SAO VÀNG'].toLocaleString()} t\n` +
                   `🏢 NINH TÂY: ${summary.cargoCompanies['NINH TÂY'].toLocaleString()} t\n` +
                   `🏢 KRÔNG BÔNG: ${summary.cargoCompanies['KRÔNG BÔNG'].toLocaleString()} t\n` +
                   `🏢 KHÁNH ĐÔNG: ${summary.cargoCompanies['KHÁNH ĐÔNG'].toLocaleString()} t\n\n` +
                   `*CHI TIẾT CÁC HẦM:*\n`;
  
  summary.progress.forEach(p => {
    let icon = p.percent >= 100 ? "✅" : (p.percent > 50 ? "🚢" : "🏗️");
    reportBody += `${icon} Hầm ${p.ham}: ${p.percent}% (${p.tons}/${p.plan})\n`;
  });
  
  reportBody += `\n👤 Người gửi: ${user}\n⏰ Lúc: ${new Date().toLocaleTimeString('vi-VN')}`;
  
  sendToTelegram(telegramToken, chatId, reportBody);
  return "Báo cáo đã được gửi tới Telegram!";
}

function sendToTelegram(token, chatId, message) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown"
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  return UrlFetchApp.fetch(url, options);
}

function approvePhieuCan(rowIdx, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) throw new Error("Hệ thống đang bận. Vui lòng thử lại sau.");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName('PHIEU_CAN');
    const targetSheet = ss.getSheetByName('TALLY_CHECK');
    
    if (!sourceSheet || !targetSheet) throw new Error("Cấu trúc bảng chưa sẵn sàng.");
    
    const rawData = sourceSheet.getRange(rowIdx, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
    let formattedData = [...rawData];
    while(formattedData.length < 25) formattedData.push("");
    
    formattedData[16] = "Đã duyệt"; // Cột 17 TRANG_THAI index 16
    
    targetSheet.appendRow(formattedData);
    sourceSheet.getRange(rowIdx, 17).setValue("Đã duyệt");
    
    addAuditLog(userEmail || "Unknown", "APPROVE", "PHIEU_CAN", rowIdx, `Duyệt phiếu: ${formattedData[1]} cho xe ${formattedData[2]}`);
    
    return "Duyệt thành công!";
  } catch (e) {
    throw new Error(e.message);
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function addAuditLog(user, action, sheetName, docId, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let auditSheet = ss.getSheetByName('AUDIT_LOGS');
    if (!auditSheet) {
      auditSheet = ss.insertSheet('AUDIT_LOGS');
      auditSheet.appendRow(['ID', 'NGƯỜI DÙNG', 'VAI TRÒ', 'HÀNH ĐỘNG', 'THỰC THỂ', 'ID THỰC THỂ', 'THỜI GIAN']);
      auditSheet.setFrozenRows(1);
    }
    
    let detailsStr = details;
    if (typeof details === 'object') {
      detailsStr = JSON.stringify(details);
    }
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    const uuid = Utilities.getUuid();
    auditSheet.appendRow([uuid, user, "", action, sheetName, String(docId), timestamp]);
  } catch (e) {
    console.error("Lỗi addAuditLog:", e.message);
  }
}
