import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../Shared/Modal';
import { dataService } from '../../services/dataService';
import { useAuthStore } from '../../stores/authStore';

interface IncidentReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncidentReport({ isOpen, onClose }: IncidentReportProps) {
  const [mode, setMode] = useState<'photo' | 'video' | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: mode === 'video' 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setMode(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (mode) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/png');
        setCapturedMedia(data);
        setMode(null);
      }
    }
  };

  const startRecording = () => {
    if (streamRef.current) {
      chunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedMedia(url);
        setMode(null);
      };
      recorder.start();
      setIsCapturing(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsUploading(true);
    
    try {
      await dataService.createIncident({
        description,
        media_url: capturedMedia || '',
        media_type: capturedMedia?.startsWith('data:image') ? 'photo' : 'video',
        reporter: user?.full_name || user?.username || 'Tally Staff'
      });
      
      setIsUploading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        reset();
      }, 3000);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const reset = () => {
    setMode(null);
    setCapturedMedia(null);
    setDescription('');
    setSuccess(false);
    setIsCapturing(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Báo cáo sự cố Cargo" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-[#0f4c75] dark:text-zinc-200 uppercase tracking-tight">Gửi báo cáo thành công!</h3>
            <p className="text-sm text-zinc-500 mt-2">Dữ liệu đã được chuyển đến bộ phận quản lý cảng.</p>
            <button 
              onClick={() => { onClose(); reset(); }}
              className="mt-6 px-6 py-2 border-2 border-zinc-100 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Đóng cửa sổ
            </button>
          </motion.div>
        ) : (
          <>
            {!capturedMedia && !mode && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMode('photo')}
                  className="flex flex-col items-center justify-center p-8 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl hover:border-[#1b9aaa] hover:bg-teal-50/30 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-3">
                    <Camera className="w-6 h-6 text-[#1b9aaa]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-[#1b9aaa]">Chụp ảnh</span>
                </button>
                <button 
                  onClick={() => setMode('video')}
                  className="flex flex-col items-center justify-center p-8 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl hover:border-[#1b9aaa] hover:bg-teal-50/30 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-3">
                    <Video className="w-6 h-6 text-[#1b9aaa]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-[#1b9aaa]">Quay Video</span>
                </button>
              </div>
            )}

            {mode && (
              <div className="relative bg-black rounded-[2rem] overflow-hidden aspect-video">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted={mode === 'photo'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                  {mode === 'photo' ? (
                    <button 
                      onClick={takePhoto}
                      className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-[#1b9aaa]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1b9aaa]" />
                    </button>
                  ) : (
                    <button 
                      onClick={isCapturing ? stopRecording : startRecording}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 ${
                        isCapturing ? 'bg-white border-red-500' : 'bg-white border-red-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-sm ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setMode(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {capturedMedia && (
              <div className="space-y-4">
                <div className="relative rounded-[2rem] overflow-hidden border-4 border-zinc-50">
                  {capturedMedia.startsWith('data:image') ? (
                    <img src={capturedMedia} className="w-full aspect-video object-cover" />
                  ) : (
                    <video src={capturedMedia} controls className="w-full aspect-video object-cover" />
                  )}
                  <button 
                    onClick={() => setCapturedMedia(null)}
                    className="absolute top-4 right-4 p-2 bg-[#0d1b2a] text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mô tả sự cố</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập chi tiết sự cố tại hầm tàu, bãi xe..."
                    className="w-full p-6 bg-zinc-50 rounded-3xl border-2 border-zinc-100 focus:border-[#1b9aaa] outline-none text-sm font-bold min-h-[120px]"
                  />
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={isUploading || !description.trim()}
                  className="w-full py-5 bg-[#0d1b2a] text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang gửi báo cáo...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gửi báo cáo ngay
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Modal>
  );
}
