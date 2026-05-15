import { WeighingTicket, HoldProgress, Truck, User, Incident, VesselSettings } from '../types';
import api from './api';
import { useAuthStore } from '../stores/authStore';

// Adapter Interface
export interface IDataService {
  getTickets(): Promise<WeighingTicket[]>;
  getPhieuCan(): Promise<WeighingTicket[]>;
  getBangKe(): Promise<WeighingTicket[]>;
  getHoldProgress(): Promise<HoldProgress[]>;
  getTrucks(): Promise<Truck[]>;
  getUsers(): Promise<User[]>;
  getAuditLogs(): Promise<any[]>;
  getSettings(): Promise<VesselSettings>;
  saveSettings(settings: Partial<VesselSettings>): Promise<boolean>;
  updateTicket(id: string, data: Partial<WeighingTicket>, sheet?: string): Promise<void>;
  createTicket(ticket: any, sheet?: string): Promise<void>;
  deleteTicket(id: string, sheet?: string): Promise<void>;
  approveTicket(rowIdx: number, updates?: any): Promise<void>;
  createTruck(truck: any): Promise<void>;
  updateTruck(id: string, data: Partial<Truck>): Promise<void>;
  deleteTruck(id: string): Promise<void>;
  getBaiDamList(): Promise<string[]>;
  createIncident(incident: Partial<Incident>): Promise<void>;
  createUser(user: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;
  toggleUserStatus(id: string): Promise<void>;
}

// Google Sheets Implementation
export class GoogleSheetsDataService implements IDataService {
  private parseVnNumber(val: any): number {
    if (val === undefined || val === null || val === '') return 0;
    const s = String(val).trim();
    if (!s) return 0;
    
    // If it contains both . and , assume . is thousands and , is decimal
    if (s.includes('.') && s.includes(',')) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    }
    
    // If it contains only , assume it might be decimal or thousands
    if (s.includes(',') && !s.includes('.')) {
      // If it looks like 12,345 (maybe thousands separator)
      if (s.split(',').pop()?.length === 3 && s.length > 4) {
        return parseFloat(s.replace(/,/g, '')) || 0;
      }
      return parseFloat(s.replace(',', '.')) || 0;
    }
    
    // If it looks like 7.380 or 23.440 (thousands dot as seen in screenshot)
    if (s.includes('.') && s.split('.').pop()?.length === 3) {
       return parseFloat(s.replace(/\./g, '')) || 0;
    }
    
    return parseFloat(s) || 0;
  }

  async getTickets(): Promise<WeighingTicket[]> {
    try {
      const response = await api.get('/gsheets/TALLY_CHECK');
      if (!Array.isArray(response.data)) return [];
      
      // Expected columns: STT SO_PHIEU BIEN_SO KHACH_HANG LOAI_HANG TL_CAN_LAN_1 TL_CAN_LAN_2 TRU_BI TL_HANG NGAY_CAN_1 GIO_CAN_1 NGAY_CAN_2 GIO_CAN_2 KHO_HANG GHI_CHU HAM_SO TRANG_THAI TEN_NV TAI_KHOAN THOI_GIAN CA TALLY_NOTE MINH_CHUNG CHECKED_BY CHECKED_TIME
      return response.data
        .map((row: any[], index: number) => ({
          id: String(row[0] || row[1] || Date.now()),
          so_phieu: String(row[1] || ''),
          bien_so_xe: String(row[2] || ''),
          don_vi: String(row[3] || ''),
          loai_xe: String(row[4] || 'Xe thùng'),
          
          tl_can_lan_1: this.parseVnNumber(row[5]),
          tl_can_lan_2: this.parseVnNumber(row[6]),
          tru_bi: this.parseVnNumber(row[7]),
          tl_hang_tan: this.parseVnNumber(row[8]), // TL_HANG is 8
          
          ngay_can_1: String(row[9] || ''),
          gio_can_1: String(row[10] || ''),
          ngay_can_2: String(row[11] || ''),
          gio_can_2: String(row[12] || ''),
          ngay: String(row[11] || row[9] || ''), // Backward compat
          
          bai_dam: String(row[13] || 'Sao Vàng'), // KHO_HANG is 13
          ghi_chu: String(row[14] || ''),
          ham_tau_assign: parseInt(String(row[15])) || 1, // HAM_SO is 15
          trang_thai: (String(row[16] || 'pending').toLowerCase()) as any, // TRANG_THAI is 16
          ten_ban_can: '', // N/A
          nhan_vien_can: String(row[17] || ''), // TEN_NV is 17
          tai_khoan: String(row[18] || ''),
          thoi_gian: String(row[19] || ''),
          ca: String(row[20] || 'Ngày'), // CA is 20
          tally_note: String(row[21] || ''), 
          minh_chung: String(row[22] || ''), // MINH_CHUNG is 22
          checked_by: String(row[23] || ''), 
          checked_time: String(row[24] || ''), 
          
          tally_checked: ['đã kiểm', 'checked', 'đã xác nhận', 'ok', 'verified'].includes(String(row[16]).toLowerCase()),
          rowIndex: index + 2, // A2 starts at index 0 + 2
          sourceSheet: 'TALLY_CHECK' as const
        }))
        .filter((t: any) => t.so_phieu || t.bien_so_xe);
    } catch (error: any) {
      const details = error.response?.data?.details || error.response?.data?.error || error.message;
      console.error('Failed to fetch tickets:', details);
      return [];
    }
  }

  async getPhieuCan(): Promise<WeighingTicket[]> {
    try {
      const response = await api.get('/gsheets/PHIEU_CAN');
      if (!Array.isArray(response.data)) return [];

      return response.data
        .map((row: any[], index: number) => ({
          id: String(row[0] || row[1] || Date.now()),
          so_phieu: String(row[1] || ''),
          bien_so_xe: String(row[2] || ''),
          don_vi: String(row[3] || ''),
          loai_xe: String(row[4] || 'Xe thùng'),
          
          tl_can_lan_1: this.parseVnNumber(row[5]),
          tl_can_lan_2: this.parseVnNumber(row[6]),
          tru_bi: this.parseVnNumber(row[7]),
          tl_hang_tan: this.parseVnNumber(row[8]),
          
          ngay_can_1: String(row[9] || ''),
          gio_can_1: String(row[10] || ''),
          ngay_can_2: String(row[11] || ''),
          gio_can_2: String(row[12] || ''),
          ngay: String(row[11] || row[9] || ''),
          
          bai_dam: String(row[13] || 'Sao Vàng'),
          ghi_chu: String(row[14] || ''),
          ham_tau_assign: parseInt(String(row[15])) || 1,
          trang_thai: (String(row[16] || 'pending').toLowerCase()) as any,
          
          nhan_vien_can: String(row[17] || ''),
          tai_khoan: String(row[18] || ''),
          thoi_gian: String(row[19] || ''),
          ca: String(row[20] || 'Ngày'),
          tally_note: String(row[21] || ''),
          minh_chung: String(row[22] || ''),
          checked_by: String(row[23] || ''),
          checked_time: String(row[24] || ''),
          
          tally_checked: ['đã kiểm', 'checked', 'đã duyệt', 'đã xác nhận', 'ok', 'verified'].includes(String(row[16]).toLowerCase()),
          ten_ban_can: '',
          rowIndex: index + 2,
          sourceSheet: 'PHIEU_CAN' as const
        }))
        .filter((t: any) => (t.so_phieu || t.bien_so_xe)); // Include ALL tickets
    } catch (error) {
      console.error('Failed to fetch Phieu Can:', error);
      return [];
    }
  }

  async getBangKe(): Promise<WeighingTicket[]> {
    try {
      const response = await api.get('/gsheets/PHIEU_CAN');
      if (!Array.isArray(response.data)) return [];

      return response.data
        .filter((row: any[]) => row && row.length >= 2 && (row[1] || row[2]))
        .map((row: any[], index: number) => ({
          id: String(row[0] || row[1] || Date.now()),
          so_phieu: String(row[1] || ''),
          bien_so_xe: String(row[2] || ''),
          don_vi: String(row[3] || ''),
          loai_xe: String(row[4] || 'Xe thùng'),
          
          tl_can_lan_1: this.parseVnNumber(row[5]),
          tl_can_lan_2: this.parseVnNumber(row[6]),
          tru_bi: this.parseVnNumber(row[7]),
          tl_hang_tan: this.parseVnNumber(row[8]),
          
          ngay_can_1: String(row[9] || ''),
          gio_can_1: String(row[10] || ''),
          ngay_can_2: String(row[11] || ''),
          gio_can_2: String(row[12] || ''),
          ngay: String(row[11] || row[9] || ''),
          
          bai_dam: String(row[13] || 'Sao Vàng'),
          ghi_chu: String(row[14] || ''),
          ham_tau_assign: parseInt(String(row[15])) || 1,
          trang_thai: (String(row[16] || 'pending').toLowerCase()) as any,
          
          nhan_vien_can: String(row[17] || ''),
          tai_khoan: String(row[18] || ''),
          thoi_gian: String(row[19] || ''),
          ca: String(row[20] || 'Ngày'),
          tally_note: String(row[21] || ''),
          minh_chung: String(row[22] || ''),
          checked_by: String(row[23] || ''),
          checked_time: String(row[24] || ''),
          
          tally_checked: ['đã kiểm', 'checked', 'đã duyệt', 'đã xác nhận', 'ok'].includes(String(row[16]).toLowerCase()),
          ten_ban_can: '',
          rowIndex: index + 2,
          sourceSheet: 'PHIEU_CAN' as const
        }));
    } catch (error) {
      console.error('Failed to fetch Bang Ke:', error);
      return [];
    }
  }

  async getHoldProgress(): Promise<HoldProgress[]> {
    try {
      const [response, settings] = await Promise.all([
        api.get('/gsheets/BC_NHANH'),
        this.getSettings()
      ]);
      
      if (!Array.isArray(response.data)) return [];

      return response.data
        .filter((row: any[]) => {
          if (!Array.isArray(row) || row.length < 1) return false;
          const firstCol = String(row[0]).toLowerCase();
          return firstCol && !firstCol.includes('tổng') && !firstCol.includes('total') && !isNaN(parseInt(firstCol));
        })
        .map((row: any[]) => {
          const hamSo = parseInt(String(row[0])) || 0;
          const xeCont = parseInt(String(row[1])) || 0;
          const xeThung = parseInt(String(row[2])) || 0;
          const tongXe = xeCont + xeThung;
          
          const saoVang = this.parseVnNumber(row[4]);
          const ninhTay = this.parseVnNumber(row[5]);
          const krongBong = this.parseVnNumber(row[6]);
          const khanhDong = this.parseVnNumber(row[7]);
          const tongHang = saoVang + ninhTay + krongBong + khanhDong;
          
          // Use target from SETTINGS if available, otherwise fallback to column 10 (index 9)
          const keHoach = settings?.hold_targets?.[hamSo] || this.parseVnNumber(row[9]);
          const chenhLech = keHoach - tongHang;
          const phanTram = keHoach > 0 ? (tongHang / keHoach) * 100 : 0;

          return {
            ham_so: hamSo,
            xe_cont: xeCont,
            xe_thung: xeThung,
            tong_xe: tongXe,
            sao_vang: saoVang,
            ninh_tay: ninhTay,
            krong_bong: krongBong,
            khanh_dong: khanhDong,
            tong_hang: tongHang,
            ke_hoach_tan: keHoach,
            chenh_lech: chenhLech,
            phan_tram: phanTram,
            trang_thai_ham: phanTram >= 100 ? 'Hoàn thành' : phanTram > 90 ? 'Gần xong' : 'Đang bốc'
          };
        });
    } catch (error: any) {
      const details = error.response?.data?.details || error.response?.data?.error || error.message;
      console.error('Failed to fetch hold progress:', details);
      return [];
    }
  }

  async getAuditLogs(): Promise<any[]> {
    try {
      const response = await api.get('/gsheets/AUDIT_LOGS');
      return Array.isArray(response.data) ? response.data.filter(r => Array.isArray(r)).reverse() : []; // Newest first
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  async getSettings(): Promise<VesselSettings> {
    try {
      const response = await api.get('/gsheets/SETTINGS');
      const settings: any = { hold_targets: {} };
      if (Array.isArray(response.data)) {
        response.data.filter((r) => Array.isArray(r) && r.length > 0).forEach((row: any[]) => {
          const key = String(row[0]);
          const value = row[1];
          if (key === 'vessel_name') settings.vessel_name = String(value || '');
          if (key === 'voyage') settings.voyage = String(value || '');
          if (key === 'Total') settings.total_target = this.parseVnNumber(value);
          if (key === 'efficiency_target') settings.efficiency_target = this.parseVnNumber(value);
          if (key.startsWith('hold_') && key.endsWith('_target')) {
            const holdNum = parseInt(key.split('_')[1]);
            settings.hold_targets[holdNum] = this.parseVnNumber(value);
          }
        });
      }
      return settings as VesselSettings;
    } catch (error: any) {
      const details = error.response?.data?.details || error.response?.data?.error || error.message;
      console.error('Failed to fetch settings:', details);
      return { vessel_name: 'SNOW CAMELLIA', voyage: 'V.52', hold_targets: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, total_target: 0 };
    }
  }

  async saveSettings(settings: Partial<VesselSettings>): Promise<boolean> {
    try {
      const updates: { key: string; value: any }[] = [];
      if (settings.vessel_name) updates.push({ key: 'vessel_name', value: settings.vessel_name });
      if (settings.voyage) updates.push({ key: 'voyage', value: settings.voyage });
      if (settings.total_target !== undefined) updates.push({ key: 'Total', value: settings.total_target });
      if (settings.efficiency_target !== undefined) updates.push({ key: 'efficiency_target', value: settings.efficiency_target });
      
      if (settings.hold_targets) {
        Object.entries(settings.hold_targets).forEach(([num, target]) => {
          updates.push({ key: `hold_${num}_target`, value: target });
        });
      }
      
      await api.post('/gsheets/SETTINGS/batch-update', { updates });
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async getTrucks(): Promise<Truck[]> {
    try {
      const response = await api.get('/gsheets/DS_XE');
      if (!Array.isArray(response.data)) return [];
      return response.data.filter(Boolean).map((row: any[]) => ({
        stt: parseInt(row[0]) || 0,
        bien_so: row[1] || '',
        don_vi: row[2] || '',
        loai_xe: row[3] || '',
        tai_xe: row[4] || '',
        phone: row[5] || '',
        don_gia: parseFloat(row[6]) || 0,
        ghi_chu: row[7] || '',
        trang_thai: (row[8] || 'Active') as any
      }));
    } catch (error) {
      return [];
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get('/gsheets/User');
      if (!Array.isArray(response.data)) return [];
      const roleMap: Record<string, any> = { 'admin': 'admin', 'it': 'admin', 'quản lý': 'supervisor', 'nhân viên': 'tally_staff', 'trợ lý': 'supervisor' };
      return response.data.filter(Boolean).map((row: any[]) => ({
        id: row[0] || Date.now().toString(),
        full_name: String(row[1] || 'Unknown'),
        username: String(row[2] || 'unknown'),
        role: roleMap[String(row[5] || '').toLowerCase()] || 'tally_staff',
        is_active: true
      }));
    } catch (error) {
      return [];
    }
  }

  async createTicket(ticket: any, sheet: string = 'PHIEU_CAN'): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) return;
    // id(0) so_phieu(1) bien_so(2) don_vi(3) loai_xe(4) tl_can_2(5) tru_bi(6) tl_hang(7) ngay_can_1(8) gio_can_1(9) ngay_can_2(10) gio_can_2(11) xuat_nhap(12) trang_thai(13) ghi_chu(14) created_at(15)
    // TALLY_CHECK columns: ... HAM_SO(16) CA(17) TALLY_NOTE(18)
    const values = [
      ticket.id || Date.now().toString(), // 0
      ticket.so_phieu || '', // 1
      ticket.bien_so_xe || '', // 2
      ticket.don_vi || '', // 3
      ticket.loai_xe || 'Xe thùng', // 4
      ticket.tl_can_1 || '', // 5
      ticket.tl_can_2 || '', // 6
      ticket.tru_bi || '', // 7
      ticket.tl_hang_tan || 0, // 8
      ticket.ngay_can_1 || '', // 9
      ticket.gio_can_1 || '', // 10
      ticket.ngay || new Date().toISOString().split('T')[0], // 11
      ticket.gio_can_2 || '', // 12
      ticket.bai_dam || '', // 13
      ticket.ghi_chu || '', // 14
      ticket.ham_tau_assign || 1, // 15
      ticket.trang_thai || 'pending', // 16
      ticket.nhan_vien_can || user.full_name || '', // 17
      user.username || '', // 18
      new Date().toISOString(), // 19
      ticket.ca || 'Ngày', // 20
      ticket.tally_note || ticket.ghi_chu || '', // 21
      ticket.minh_chung || '', // 22
      ticket.checked_by || '', // 23
      ticket.checked_time || '' // 24
    ];
    await api.post(`/gsheets/${sheet}`, { user, values });
  }

  async createTicketsBatch(tickets: any[], sheet: string = 'PHIEU_CAN'): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    // Process items in chunks of 50 to avoid sending too large payload at once which causes 'upload nhiều sẽ bị lỗi'
    const chunkSize = 50;
    for (let i = 0; i < tickets.length; i += chunkSize) {
      const chunk = tickets.slice(i, i + chunkSize);
      
      const rows = chunk.map((ticket, idx) => [
        ticket.id || `T${Date.now()}-${idx}`, // 0
        ticket.so_phieu || '', // 1
        ticket.bien_so_xe || '', // 2
        ticket.don_vi || '', // 3
        ticket.loai_xe || 'Xe thùng', // 4
        ticket.tl_can_1 || '', // 5
        ticket.tl_can_2 || '', // 6
        ticket.tru_bi || '', // 7
        ticket.tl_hang_tan || 0, // 8
        ticket.ngay_can_1 || '', // 9
        ticket.gio_can_1 || '', // 10
        ticket.ngay || new Date().toISOString().split('T')[0], // 11
        ticket.gio_can_2 || '', // 12
        ticket.bai_dam || '', // 13
        ticket.ghi_chu || '', // 14
        ticket.ham_tau_assign || 1, // 15
        ticket.trang_thai || 'pending', // 16
        ticket.nhan_vien_can || user.full_name || '', // 17
        user.username || '', // 18
        new Date().toISOString(), // 19
        ticket.ca || 'Ngày', // 20
        ticket.tally_note || ticket.ghi_chu || '', // 21
        ticket.minh_chung || '', // 22
        ticket.checked_by || '', // 23
        ticket.checked_time || '' // 24
      ]);
      
      await api.post(`/gsheets/${sheet}/batch`, { user, values: rows });
    }
  }

  async approveTicket(rowIdx: number, updates?: any): Promise<void> {
    const user = useAuthStore.getState().user;
    try {
      await api.post('/gsheets/approve', { rowIdx, user, updates });
    } catch (error) {
      console.error('Failed to approve ticket:', error);
      throw error;
    }
  }

  async updateTicket(id: string, data: Partial<WeighingTicket>, sheet: string = 'TALLY_CHECK'): Promise<void> {
    const user = useAuthStore.getState().user;
    
    // Map of WeighingTicket keys to Column Indexes in Google Sheets
    const updates: Record<number, any> = {};
    if (data.trang_thai !== undefined) updates[16] = data.trang_thai;
    if (data.tally_checked !== undefined) {
       updates[16] = data.tally_checked ? 'checked' : 'pending';
    }
    if (data.tl_hang_tan !== undefined) updates[8] = data.tl_hang_tan;
    if (data.ngay !== undefined) updates[11] = data.ngay;
    if (data.ham_tau_assign !== undefined) updates[15] = data.ham_tau_assign;
    if (data.ca !== undefined) updates[20] = data.ca;
    if (data.bai_dam !== undefined) updates[13] = data.bai_dam;
    // Removed tl_kho_tan since it is duplicate with 8?
    if (data.bien_so_xe !== undefined) updates[2] = data.bien_so_xe;
    if (data.ghi_chu !== undefined) updates[14] = data.ghi_chu;
    if (data.tally_note !== undefined) updates[21] = data.tally_note;
    if (data.nhan_vien_can !== undefined) updates[17] = data.nhan_vien_can;
    if (data.checked_by !== undefined) updates[23] = data.checked_by;
    if (data.checked_time !== undefined) updates[24] = data.checked_time;

    // Use rowIndex if id looks like one
    const isRowIdx = !isNaN(Number(id)) && id.length < 6;
    const body: any = { updates, user };
    if (isRowIdx) body.rowIndex = parseInt(id);

    await api.patch(`/gsheets/${sheet}/${id}`, body);
  }

  async deleteTicket(id: string, sheetCode: string = 'TALLY_CHECK', rowIndex?: number): Promise<void> {
    const user = useAuthStore.getState().user;
    
    // Only admins are allowed to delete tickets to preserve data integrity
    if (user?.role !== 'admin') {
      throw new Error('Chỉ Quản trị viên (Admin) mới có quyền xóa phiếu.');
    }
    
    if (rowIndex !== undefined && rowIndex !== null) {
      await api.delete(`/gsheets/${sheetCode}/${rowIndex}`, { data: { user } });
      return;
    }

    // Fallback: find rowIndex by ID
    const response = await api.get(`/gsheets/${sheetCode}`);
    if (!Array.isArray(response.data)) return;
    
    const foundIdx = response.data.findIndex((r: any[]) => r[1] === id || r[0] === id);
    if (foundIdx !== -1) {
      await api.delete(`/gsheets/${sheetCode}/${foundIdx + 2}`, { data: { user } });
    }
  }

  async createTruck(truck: any): Promise<void> {
    const user = useAuthStore.getState().user;
    await api.post('/gsheets/DS_XE', {
      user,
      values: [Date.now().toString(), truck.bien_so, truck.don_vi, truck.loai_xe, truck.tai_xe, truck.phone, truck.don_gia, truck.ghi_chu, truck.trang_thai || 'Active']
    });
  }

  async updateTruck(id: string, data: Partial<Truck>): Promise<void> {
    const user = useAuthStore.getState().user;
    const values = [
      data.stt || 0,
      data.bien_so || id,
      data.don_vi || '',
      data.loai_xe || '',
      data.tai_xe || '',
      data.phone || '',
      data.don_gia || 0,
      data.ghi_chu || '',
      data.trang_thai || 'Active'
    ];
    await api.put(`/gsheets/DS_XE/${id}`, { values, user });
  }

  async deleteTruck(id: string): Promise<void> {
    const user = useAuthStore.getState().user;
    const response = await api.get('/gsheets/DS_XE');
    const rowIndex = response.data.findIndex((r: any[]) => r[1] === id);
    if (rowIndex !== -1) {
      await api.delete(`/gsheets/DS_XE/${rowIndex + 2}`, { data: { user } });
    }
  }

  async getBaiDamList(): Promise<string[]> {
    try {
      const response = await api.get('/gsheets/PHIEU_CAN');
      if (!Array.isArray(response.data)) return ['Sao Vàng'];
      const values = response.data.map(r => String(r[13] || 'Sao Vàng').trim());
      return Array.from(new Set(values)).filter(Boolean);
    } catch (error) {
      return ['Sao Vàng'];
    }
  }

  async createIncident(incident: Partial<Incident>): Promise<void> {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const values = [new Date().toLocaleString('vi-VN'), user.full_name || user.username, incident.media_type === 'video' ? 'Video sự cố' : 'Ảnh sự cố', incident.description || '', incident.media_url || '', '-'];
    await api.post('/gsheets/INCIDENTS', { user, values });
  }

  async createUser(user: Partial<User>): Promise<void> {
    const currentUser = useAuthStore.getState().user;
    await api.post('/gsheets/User', {
      user: currentUser,
      values: [Date.now().toString(), user.full_name, user.username, '123456', '', user.role]
    });
  }

  async deleteUser(id: string): Promise<void> {
    const currentUser = useAuthStore.getState().user;
    const response = await api.get('/gsheets/User');
    const rowIndex = response.data.findIndex((r: any[]) => r[0] === id);
    if (rowIndex !== -1) {
      await api.delete(`/gsheets/User/${rowIndex + 2}`, { data: { user: currentUser } });
    }
  }

  async toggleUserStatus(id: string): Promise<void> {
    // Implement if needed
  }
}

export const dataService = new GoogleSheetsDataService();
