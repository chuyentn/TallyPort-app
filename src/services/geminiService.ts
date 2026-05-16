import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  async getChatResponse(message: string, systemState: any) {
    try {
      // @ts-ignore
      const apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        return "Lỗi: Chưa cấu hình khóa API (VITE_GEMINI_API_KEY). Vui lòng cấu hình ở tab Variables & Secrets.";
      }
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `
        Bạn là "Trợ lý Điều hành TallyPort AI" - trợ lý ảo của hệ thống Snow Camellia.
        DỮ LIỆU: ${JSON.stringify(systemState)}
        CÂU HỎI: "${message}"
        Trả lời ngắn gọn, chuyên nghiệp, tiếng Việt.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return `Xin lỗi, hệ thống AI đang bảo trì. Lỗi: ${error.message || error}. Vui lòng thử lại sau.`;
    }
  }
};
