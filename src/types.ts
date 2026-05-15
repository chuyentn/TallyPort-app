export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'tally_staff' | 'driver_view';
  phone?: string;
  is_active?: boolean;
}

export interface Truck {
  stt: number;
  bien_so: string;
  don_vi: string;
  loai_xe: string;
  tai_xe: string;
  phone: string;
  don_gia: number;
  ghi_chu: string;
  trang_thai?: 'Active' | 'Inactive' | 'Maintenance';
}

export interface WeighingTicket {
  id: string;
  so_phieu: string;
  ngay: string; // Used as fallback or original
  ca: string;
  bien_so_xe: string;
  loai_xe: string;
  don_vi: string;
  bai_dam: string;
  
  tl_can_lan_1?: number | string;
  tl_can_lan_2?: number | string;
  tru_bi?: number | string;
  tl_hang_tan: number;
  
  ngay_can_1?: string;
  gio_can_1?: string;
  ngay_can_2?: string;
  gio_can_2?: string;
  
  ten_ban_can?: string;
  nhan_vien_can?: string;
  tai_khoan?: string;
  thoi_gian?: string;
  ham_tau_assign: number;
  trang_thai: 'pending' | 'checked' | 'issue' | 'đã duyệt' | string;
  tally_checked: boolean;
  checked_by?: string;
  checked_time?: string;
  ghi_chu?: string;
  tally_note?: string;
  minh_chung?: string;
  don_gia?: number;
  thanh_tien?: number;
  rowIndex?: number;
  sourceSheet?: 'PHIEU_CAN' | 'TALLY_CHECK';
}

export interface HoldProgress {
  ham_so: number;
  xe_cont: number;
  xe_thung: number;
  tong_xe: number;
  sao_vang: number;
  ninh_tay: number;
  krong_bong: number;
  khanh_dong: number;
  tong_hang: number;
  ke_hoach_tan: number;
  chenh_lech: number;
  phan_tram: number;
  trang_thai_ham: string;
}

export interface Incident {
  id: string;
  timestamp: string;
  description: string;
  media_url: string;
  media_type: 'photo' | 'video';
  reporter: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface VesselSettings {
  vessel_name: string;
  voyage: string;
  hold_targets: Record<number, number>;
  total_target: number;
  efficiency_target?: number;
}
