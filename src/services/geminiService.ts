import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  async getChatResponse(message: string, systemState: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
