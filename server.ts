import express from "express";
import axios from "axios";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

let sheets: any = null;
let auth: any = null;

// --- GOOGLE AUTH INITIALIZATION ---
function formatPrivateKey(key: string | undefined): string {
  if (!key) return "";
  
  let formatted = key;
  
  // 1. Resolve escaped newlines (common in env vars)
  formatted = formatted.replace(/\\n/g, "\n");
  
  // 2. Remove surrounding quotes (common in env vars)
  formatted = formatted.trim();
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1);
  }

  // 3. Handle JSON-pasted keys (if user pasted the entire service account JSON)
  if (formatted.startsWith('{')) {
    try {
      const obj = JSON.parse(formatted);
      if (obj.private_key) formatted = obj.private_key;
    } catch (e) {
      console.error('Error parsing Google Private Key as JSON:', e);
    }
  }

  // 4. Normalize PEM format
  const header = "-----BEGIN PRIVATE KEY-----";
  const rsaHeader = "-----BEGIN RSA PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";
  const rsaFooter = "-----END RSA PRIVATE KEY-----";
  
  const hasStandard = formatted.includes(header) && formatted.includes(footer);
  const hasRsa = formatted.includes(rsaHeader) && formatted.includes(rsaFooter);

  if (hasStandard || hasRsa) {
    const currentHeader = hasRsa ? rsaHeader : header;
    const currentFooter = hasRsa ? rsaFooter : footer;
    
    // Extract everything between header and footer
    const startIndex = formatted.indexOf(currentHeader) + currentHeader.length;
    const endIndex = formatted.indexOf(currentFooter);
    let body = formatted.substring(startIndex, endIndex);
    
    // Clean body: remove all whitespace, newlines, and carriage returns
    body = body.replace(/\s+/g, "");
    
    // Chunk body into 64-char lines as per PEM spec
    const lines = body.match(/.{1,64}/g) || [];
    return `${currentHeader}\n${lines.join("\n")}\n${currentFooter}`;
  } else if (formatted.length > 100 && !formatted.includes("BEGIN")) {
    // If headers are missing but it looks like a key body, wrap it
    let body = formatted.replace(/\s+/g, "");
    const lines = body.match(/.{1,64}/g) || [];
    return `${header}\n${lines.join("\n")}\n${footer}`;
  }
  
  return formatted;
}

try {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const key = formatPrivateKey(rawKey);

  if (email && key && key.includes("BEGIN")) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key,
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
      ],
    });
    sheets = google.sheets({ version: "v4", auth });
    console.log("✅ Google Auth initialized successfully for:", email);
  } else {
    console.warn("⚠️ GOOGLE Auth variables missing or invalid format.");
    console.warn("   EMAIL:", email ? "SET" : "MISSING");
    console.warn("   KEY Format:", key ? (key.includes("BEGIN") ? "PEM (VALID)" : "NON-PEM (INVALID)") : "MISSING");
  }
} catch (error: any) {
  console.error("CRITICAL: Failed to initialize Google Auth:", error.message);
}

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SHEETS_ID || "1a6G8JP7F0xfif5Hb87FZ_BUZ2EACmScmY_MlKf-5dS4";

// --- HELPERS ---

async function sendTelegramNotification(title: string, user: any, details: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "8702845729:AAGROiJGHoY9pu5SEl6CYReCodzD6F5d6AU";
  const chatId = process.env.TELEGRAM_CHAT_ID || "-1003937677378";
  
  if (!token || !chatId) {
    console.warn("Telegram config missing");
    return;
  }

  // Phân tách details nếu có nhiều dòng để format đẹp hơn
  const detailLines = details.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const formattedDetails = detailLines.length > 1 
    ? detailLines.map(line => `▫️ ${line}`).join('\n')
    : `🔹 ${details}`;

  const text = `
*${title}*
━━━━━━━━━━━━━━━━━━
👤 *Người dùng:* \`${user?.full_name || 'N/A'}\`
🆔 *ID:* \`${user?.username || 'N/A'}\`
🏷️ *Phân quyền:* \`${user?.role || 'User'}\`

📖 *Nội dung thực hiện:*
${formattedDetails}

⏰ *Thời gian:* ${new Date().toLocaleString('vi-VN')}
━━━━━━━━━━━━━━━━━━
  `;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error("Telegram Notify Error:", error);
  }
}

async function addAuditLog(user: any, action: string, sheet: string, id: string, details: string) {
  if (!sheets) return;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "AUDIT_LOGS!A2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleString('vi-VN'),
          user?.full_name + " (" + (user?.username || 'unknown') + ")",
          action,
          sheet,
          id,
          details
        ]]
      },
    });
    
    // Gửi Telegram cho các hành động thay đổi dữ liệu
    if (action !== 'READ') {
      const icon = action === 'LOGIN' ? "🔐" : (action === 'CREATE' ? "📝" : "🔄");
      await sendTelegramNotification(
        `${icon} ${action} - ${sheet}`,
        user,
        details.length > 200 ? details.substring(0, 200) + "..." : details
      );
    }
  } catch (error) {
    console.error("Audit Log Error:", error);
  }
}

// Cấu hình Gemini AI
let GEMINI_API_KEYS = [
  "AIzaSyCVrlJ-Tk4RH-ZIrzD2pBscdJM7pn-jSQE",
  "AIzaSyDmubBgqDd_JzDB5wh2QpmS_f-IsWjJpNo",
  "AIzaSyAogKRyaGPJakbMBv5ON2BoxoTJp_2_Dxg",
  "AIzaSyCKLEUInpYjqAUisC7tJl8WpVd4_30hCWk",
  "AIzaSyDDZVVaU_imkIOgr3nL_qQ8KmkBdG9lNmc",
  "AIzaSyCR_ioBfIHsynK0fp-XWtYjVF9t6cyAiiI",
  "AIzaSyCPNU3UvE7yf5xnCgF6hiJmcWoq4VF_sd8"
];

if (process.env.GEMINI_API_KEY && !GEMINI_API_KEYS.includes(process.env.GEMINI_API_KEY)) {
  GEMINI_API_KEYS.push(process.env.GEMINI_API_KEY);
}

let currentGeminiKeyIndex = 0;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // --- API AI KEY MANAGEMENT ---
  app.get("/api/ai/keys", (req, res) => {
    res.json(GEMINI_API_KEYS);
  });

  app.post("/api/ai/keys", (req, res) => {
    const { key } = req.body;
    if (key && !GEMINI_API_KEYS.includes(key)) {
      GEMINI_API_KEYS.push(key);
    }
    res.json({ success: true, keys: GEMINI_API_KEYS });
  });

  app.delete("/api/ai/keys/:index", (req, res) => {
    const idx = parseInt(req.params.index);
    if (idx >= 0 && idx < GEMINI_API_KEYS.length) {
      GEMINI_API_KEYS.splice(idx, 1);
    }
    res.json({ success: true, keys: GEMINI_API_KEYS });
  });

  app.post("/api/ai/check", async (req, res) => {
    const liveKeys = [];
    let checkedCount = 0;
    
    for (const key of GEMINI_API_KEYS) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Just a simple ping to see if key works
        await model.generateContent("ping");
        liveKeys.push(key);
      } catch (error) {
        console.warn(`Key API Failed: ${key.substring(0, 8)}...`);
      }
      checkedCount++;
    }

    if (liveKeys.length > 0) {
      GEMINI_API_KEYS = liveKeys;
    }

    res.json({ success: true, total: liveKeys.length, keys: GEMINI_API_KEYS });
  });

  // --- API AI ---
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, systemState } = req.body;

      const prompt = `
        Bạn là "Trợ lý Điều hành TallyPort AI" - trợ lý ảo của hệ thống Snow Camellia.
        DỮ LIỆU: ${JSON.stringify(systemState)}
        CÂU HỎI: "${message}"
        Trả lời ngắn gọn, chuyên nghiệp, tiếng Việt.
      `;

      let attempts = 0;
      let lastError;
      const maxAttempts = GEMINI_API_KEYS.length;

      while (attempts < maxAttempts) {
        try {
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEYS[currentGeminiKeyIndex]);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          res.json({ text: result.response.text() });
          return; // Thành công thì return luôn
        } catch (error) {
          console.warn(`Gemini API Key at index ${currentGeminiKeyIndex} failed. Switching to next key...`);
          lastError = error;
          attempts++;
          currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
        }
      }

      console.error("All Gemini API keys failed:", lastError);
      res.json({ text: "Xin lỗi, hệ thống AI đang bảo trì. Vui lòng thử lại sau." });
    } catch (error) {
      res.status(500).json({ error: "AI Error", text: "Xin lỗi, hệ thống AI đang bảo trì. Vui lòng thử lại sau." });
    }
  });

  // --- API GOOGLE SHEETS ---

  // Auth: Đăng nhập
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Fallback cho môi trường dev khi chưa cấu hình Google Sheets xong
      if ((username === "admin" && password === "admin") || (username?.toString().trim() === 'admin' && password?.toString().trim() === 'admin')) {
        const devUser = {
          id: "dev-admin",
          full_name: "Developer Admin",
          username: "admin",
          role: "admin",
          image: ""
        };
        console.log("Dev Admin fallback triggered");
        return res.json({ success: true, user: devUser, message: "Đăng nhập bằng tài khoản khẩn cấp (Dev Mode)" });
      }

      if (!sheets) {
        return res.status(503).json({ 
          success: false, 
          message: "Hệ thống chưa được cấu hình Google Sheets API. Sử dụng admin/admin để vào tạm thời.",
          details: "Sheets service is null"
        });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "User!A2:F",
      });

      const users = response.data.values || [];
      const user = users.find(u => 
        u[2]?.toString().trim() === username?.toString().trim() && 
        u[3]?.toString().trim() === password?.toString().trim()
      );

      if (user) {
        const roleMap: Record<string, string> = {
          'admin': 'admin',
          'it': 'admin',
          'quản lý': 'supervisor',
          'super admin': 'admin',
          'nhân viên': 'tally_staff',
          'trợ lý': 'supervisor',
          'tally': 'tally_staff'
        };
        const gsheetsRole = (user[5] || 'tally').toLowerCase();
        const userData = {
          id: user[0],
          full_name: user[1],
          username: user[2],
          role: roleMap[gsheetsRole] || 'tally_staff',
          image: user[4]
        };

        // Ghi log đăng nhập và gửi thông báo
        await addAuditLog(userData, 'LOGIN', 'User', user[0], `Người dùng ${user[1]} đăng nhập vào hệ thống`);
        await sendTelegramNotification("🔐 ĐĂNG NHẬP HỆ THỐNG", userData, `Vừa truy cập vào ứng dụng TallyPort`);

        res.json({
          success: true,
          user: userData
        });
      } else {
        res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
      }
    } catch (error) {
      console.error("GSheets Auth Error:", error);
      res.status(500).json({ error: "Lỗi kết nối Google Sheets" });
    }
  });

  // Data: Cập nhật dòng (Update) dựa trên ID ở cột A hoặc rowIndex nếu id là số nhỏ
  app.put("/api/gsheets/:sheet/:id", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Google Sheets service unavailable" });
      const { sheet, id } = req.params;
      const { values, user, rowIndex: bodyRowIndex } = req.body;

      let rowIndex = -1;
      
      // Nếu có rowIndex trong body hoặc id là số (với độ dài ngắn - tránh nhầm với UID)
      if (bodyRowIndex !== undefined) {
        rowIndex = bodyRowIndex - 1;
      } else if (!isNaN(Number(id)) && id.length < 6) {
        rowIndex = Number(id) - 1;
      }

      if (rowIndex === -1) {
        // Tìm vị trí dòng dựa trên cột ID
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheet}!A:B`,
        });
        const rows = response.data.values || [];
        const idColumnIndex = (sheet === 'TALLY_CHECK' || sheet === 'DS_XE') ? 1 : 0;
        const targetId = id?.toString().trim();
        
        rowIndex = rows.findIndex(row => {
          const cellVal = row[idColumnIndex]?.toString().trim();
          return cellVal === targetId;
        });
      }

      if (rowIndex === -1) {
        return res.status(404).json({ error: "Không tìm thấy dữ liệu để cập nhật" });
      }

      // 2. Ghi đè vào dòng đó
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [values] },
      });

      // 3. Ghi Audit Log
      let logDetails = `Dòng: ${rowIndex + 1}`;
      if (sheet === 'TALLY_CHECK' || sheet === 'PHIEU_CAN') {
        const status = values[16] || 'pending';
        logDetails = `Cập nhật: Xe ${values[2]} (#${values[1]})\nTrạng thái: ${status}\nHầm: ${values[15]}\nKhối lượng: ${values[8]} Tấn\nGhi chú: ${values[14] || 'Không'}`;
      }
      
      await addAuditLog(user, 'UPDATE', sheet, id, logDetails);

      // 4. Gửi Telegram nếu là xác nhận Tally
      if (sheet === 'TALLY_CHECK') {
        const trangThai = String(values[16] || '').toLowerCase();
        if (trangThai === 'checked' || trangThai === 'đã kiểm' || trangThai === 'đã xác nhận' || trangThai === 'ok') {
          await sendTelegramNotification(
            "✅ HOÀN TẤT KIỂM TALLY",
            user,
            `Xe: ${values[2]} (#${values[1]})\nHầm: ${values[15]}\nBãi: ${values[13]}\nTL Cân: ${values[8]} T\nTrạng thái: Đã bốc xong`
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("GSheets Update Error:", error);
      res.status(500).json({ error: "Lỗi cập nhật Google Sheets" });
    }
  });

  // Data: Cập nhật một phần dòng (Patch)
  app.patch("/api/gsheets/:sheet/:id", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Google Sheets service unavailable" });
      const { sheet, id } = req.params;
      const { updates, user, rowIndex: bodyRowIndex } = req.body; // updates: { index: value }

      let rowIndex = -1;
      if (bodyRowIndex !== undefined) {
        rowIndex = bodyRowIndex - 1;
      } else if (!isNaN(Number(id)) && id.length < 6) {
        rowIndex = Number(id) - 1;
      }

      if (rowIndex === -1) {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheet}!A:B`,
        });
        const rows = response.data.values || [];
        const idColumnIndex = (sheet === 'TALLY_CHECK' || sheet === 'DS_XE') ? 1 : 0;
        const targetId = id?.toString().trim();
        rowIndex = rows.findIndex(row => row[idColumnIndex]?.toString().trim() === targetId);
      }

      if (rowIndex === -1) return res.status(404).json({ error: "Not found" });

      // 1. Fetch current row
      const currentRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A${rowIndex + 1}:Z${rowIndex + 1}`,
      });
      const currentRow = currentRes.data.values?.[0] || [];
      const newRow = [...currentRow];
      
      // 2. Apply updates
      Object.entries(updates).forEach(([idx, val]) => {
        const colIdx = parseInt(idx);
        while (newRow.length <= colIdx) newRow.push("");
        newRow[colIdx] = val;
      });

      // 3. Update
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [newRow] },
      });

      let logDetails = `Patch: Row ${rowIndex + 1}`;
      if (sheet === 'TALLY_CHECK' || sheet === 'PHIEU_CAN') {
        logDetails = `Patch: Xe ${newRow[2]} (#${newRow[1]})\nTrạng thái: ${newRow[16]}\nHầm: ${newRow[15]}\nKhối lượng: ${newRow[8]} Tấn\nGhi chú: ${newRow[14] || 'Không'}`;
      }

      await addAuditLog(user, 'PATCH', sheet, id, logDetails);

      // Nếu là Tally Check và vừa chuyển sang trạng thái "checked"
      if (sheet === 'TALLY_CHECK' && updates[16]) {
        const newStatus = String(updates[16]).toLowerCase();
        if (['checked', 'đã kiểm', 'đã xác nhận', 'ok'].includes(newStatus)) {
          await sendTelegramNotification(
            "✅ XÁC NHẬN TALLY (PATCH)",
            user,
            `Xe: ${newRow[2]} (#${newRow[1]})\nHầm: ${newRow[15]}\nBãi: ${newRow[13]}\nTL Cân: ${newRow[8]} T\nTrạng thái: Xác nhận hoàn tất`
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("GSheets Patch Error:", error);
      res.status(500).json({ error: "Lỗi cập nhật" });
    }
  });

  // Data: Lấy danh sách Sheet để debug
  app.get("/api/gsheets/meta/sheets", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Sheets not initialized" });
      const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const sheetTitles = response.data.sheets?.map((s: any) => s.properties?.title) || [];
      res.json({ sheets: sheetTitles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Data: Duyệt phiếu (Di chuyển hàng từ PHIEU_CAN sang TALLY_CHECK)
  app.post("/api/gsheets/approve", async (req, res) => {
    const { rowIdx, user, updates } = req.body;
    console.log(`[APPROVE] Request for row ${rowIdx} by ${user?.username}`);
    try {
      if (!sheets) return res.status(503).json({ error: "Sheets not initialized" });
      if (!rowIdx) return res.status(400).json({ error: "Missing row index" });
      
      // 1. Get raw data from PHIEU_CAN (Fetch more columns to catch HAM, CA, etc.)
      const sourceRange = `PHIEU_CAN!A${rowIdx}:Z${rowIdx}`;
      const sourceRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sourceRange,
      });
      
      const rawRow = sourceRes.data.values?.[0];
      if (!rawRow) return res.status(404).json({ error: "Không tìm thấy hàng để duyệt" });

      const currentStatus = String(rawRow[16] || '').toLowerCase();
      if (currentStatus === 'đã duyệt') {
         console.warn(`[APPROVE] Ticket ${rawRow[1]} was already approved. Skipping.`);
         return res.json({ success: true, message: "Already approved" }); // return success to avoid error popups, just ignoring it
      }

      // 2. Format for TALLY_CHECK
      // Ensure we have enough columns
      let tallyRow = [...rawRow];
      while (tallyRow.length < 25) tallyRow.push("");
      
      tallyRow[16] = "Đã duyệt"; // Cập nhật trạng thái
      
      if (updates) {
        if (updates.ham_so) tallyRow[15] = String(updates.ham_so);
        if (updates.ca) tallyRow[20] = String(updates.ca);
        if (updates.checked_by) tallyRow[23] = updates.checked_by;
        if (updates.checked_time) tallyRow[24] = updates.checked_time;
      }

      // Sync columns if they were scattered
      // A(0):ID, B(1):SO_PHIEU, C(2):BIEN_SO, D(3):DON_VI, E(4):LOAI_XE, I(8):TL_HANG, Q(16):STATUS, L(11):NGAY
      // P(15):HAM, U(20):CA
      // X(23): CHECKED_BY, Y(24): CHECKED_TIME

      // 3. Append to TALLY_CHECK
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "TALLY_CHECK!A1",
        valueInputOption: "RAW",
        requestBody: { values: [tallyRow] },
      });

      // 4. Update Status and other fields in PHIEU_CAN
      // Range: P to Y (15 to 24)
      const updateRow = [...tallyRow].slice(15, 25); 
      // This will update P (ham_so), Q (Trang Thai), etc. up to Y
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `PHIEU_CAN!P${rowIdx}:Y${rowIdx}`,
        valueInputOption: "RAW",
        requestBody: { values: [updateRow] },
      });

      // 5. Ghi Audit Log
      await addAuditLog(user, 'APPROVE', 'PHIEU_CAN', rowIdx.toString(), `Duyệt phiếu ${rawRow[1]} sang Tally Check (Hầm ${updates?.ham_so || '—'}, Ca ${updates?.ca || '—'})`);

      // 6. Gửi Telegram
      await sendTelegramNotification(
        "📝 DUYỆT PHIẾU CÂN",
        user,
        `Xe ${rawRow[2]} (#${rawRow[1]}) đã được duyệt và chuyển sang Tally.\nSẵn sàng bốc hàng tại Hầm ${updates?.ham_so || rawRow[15] || '—'}`
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Approval Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Data: Lấy dữ liệu theo Sheet Name
  app.get("/api/gsheets/:sheet", async (req, res) => {
    const { sheet } = req.params;
    try {
      if (!sheets) {
        console.warn(`Request for sheet ${sheet} but sheets service is unavailable.`);
        return res.status(503).json({ 
          error: "Hệ thống chưa kết nối được Google Sheets", 
          details: "Vui lòng kiểm tra lại GOOGLE_PRIVATE_KEY và GOOGLE_SERVICE_ACCOUNT_EMAIL trong Settings." 
        });
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A2:Z`,
      });
      res.json(response.data.values || []);
    } catch (error: any) {
      console.error(`Fetch Error [${sheet}]:`, error.message);
      
      const isAuthError = error.message?.includes('DECODER') || error.message?.includes('auth') || error.message?.includes('key');
      
      if (isAuthError) {
        return res.status(500).json({ 
          error: "Lỗi xác thực Google Sheets", 
          details: "Khóa bảo mật (Private Key) không hợp lệ. Hãy đảm bảo copy đầy đủ cả phần BEGIN và END.",
          rawError: error.message
        });
      }

      if (error.code === 400 || error.message?.includes('not found')) {
        console.warn(`Sheet ${sheet} not found, returning empty array.`);
        return res.json([]);
      }
      res.status(500).json({ error: `Không thể lấy dữ liệu từ sheet ${sheet}`, details: error.message });
    }
  });

      // Data: Thêm dòng mới
  app.post("/api/gsheets/:sheet", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Google Sheets service unavailable" });
      const { sheet } = req.params;
      const { values, user } = req.body; 
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [values] },
      });

      const id = values[0] || 'NEW';
      let logDetails = JSON.stringify(values);
      if (sheet === 'TALLY_CHECK' || sheet === 'PHIEU_CAN') {
        logDetails = `Tạo mới: Xe ${values[2]} (#${values[1]})\nĐơn vị: ${values[3]}\nKhối lượng: ${values[8]} Tấn\nTrạng thái: ${values[16]}`;
        
        // Gửi Telegram luôn cho việc tạo phiếu mới
        await sendTelegramNotification(
          sheet === 'TALLY_CHECK' ? "🆕 TẠO MỚI TALLY" : "🆕 TẠO PHIẾU CÂN",
          user,
          logDetails
        );
      }
      
      await addAuditLog(user, 'CREATE', sheet, id.toString(), logDetails);

      res.json({ success: true });
    } catch (error) {
      console.error("Append Error:", error);
      res.status(500).json({ error: "Không thể thêm dữ liệu" });
    }
  });

  // Data: Bulk insert (Batch Add)
  app.post("/api/gsheets/:sheet/batch", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Google Sheets service unavailable" });
      const { sheet } = req.params;
      const { values, user } = req.body; 
      
      if (!Array.isArray(values) || values.length === 0) {
         return res.status(400).json({ error: "Empty values array" });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet}!A2`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: values }, // values is already an array of rows
      });
      
      const count = values.length;
      await addAuditLog(user, 'BULK_CREATE', sheet, 'Multiple', `Nhập hàng loạt ${count} dòng.`);

      await sendTelegramNotification(
          "📦 NHẬP HÀNG LOẠT (BATCH)",
          user,
          `Đã import thành công ${count} bản ghi vào ${sheet}.`
      );

      res.json({ success: true, importedCount: count });
    } catch (error) {
      console.error("Batch Append Error:", error);
      res.status(500).json({ error: "Không thể import hàng loạt" });
    }
  });

  // Data: Xóa dòng (Delete) dựa trên rowIndex
  app.delete("/api/gsheets/:sheet/:rowIndex", async (req, res) => {
    try {
      if (!sheets) return res.status(503).json({ error: "Google Sheets service unavailable" });
      const { sheet, rowIndex } = req.params;
      const { user } = req.body;
      const idx = parseInt(rowIndex);

      // Lấy thông tin trước khi xóa
      let deletedInfo = `Dòng thứ ${rowIndex}`;
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheet}!A${idx}:Z${idx}`,
        });
        const row = res.data.values?.[0] || [];
        if (row.length > 0) {
          deletedInfo = `Xóa dữ liệu: ${sheet === 'TALLY_CHECK' || sheet === 'PHIEU_CAN' ? `Xe ${row[2]} (#${row[1]})` : `Dòng ${rowIndex} (${row[0]})`}`;
        }
      } catch (e) {
        console.warn("Could not fetch row before delete", e);
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: await getSheetIdByName(sheet),
                  dimension: "ROWS",
                  startIndex: idx - 1,
                  endIndex: idx,
                },
              },
            },
          ],
        },
      });

      await addAuditLog(user, 'DELETE', sheet, rowIndex, deletedInfo);
      
      // Gửi Telegram cảnh báo xóa
      await sendTelegramNotification(`⚠️ XÓA DỮ LIỆU - ${sheet}`, user, deletedInfo);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: "Không thể xóa dòng" });
    }
  });

  // Helper: Lấy Sheet ID từ Name
  async function getSheetIdByName(name: string) {
    const ss = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = ss.data.sheets?.find(s => s.properties?.title === name);
    return sheet?.properties?.sheetId || 0;
  }

  // --- SYSTEM ---
  app.get("/api/ping", (req, res) => {
    res.json({ pong: true });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: "live", 
      spreadsheetId: SPREADSHEET_ID,
      googleAuth: !!sheets,
      env: {
        hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasKey: !!process.env.GOOGLE_PRIVATE_KEY
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
