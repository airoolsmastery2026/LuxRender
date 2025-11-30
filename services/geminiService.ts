import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  // In a real app, we handle the missing key more gracefully or prompt user.
  // Here we proceed, but the call might fail if key is invalid.
  return new GoogleGenAI({ apiKey });
};

export const generateRealEstateScript = async (
  projectName: string, 
  type: string, 
  features: string,
  lang: 'en' | 'vi'
): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Act as a professional real estate copywriter. 
      Write a captivating 30-second video script for a ${type} named "${projectName}".
      Key features: ${features}.
      Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}.
      Tone: Cinematic, luxurious, emotional.
      Format: Just the voiceover text, no scene descriptions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || (lang === 'vi' ? "Không thể tạo kịch bản lúc này." : "Could not generate script.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock response for demo purposes if API key is missing
    if (lang === 'vi') {
      return `Chào mừng đến với ${projectName}. Một kiệt tác ${type} đích thực. Với ${features}, không gian này định nghĩa lại sự sang trọng. Hãy tận hưởng cuộc sống đẳng cấp ngay hôm nay.`;
    }
    return `Welcome to ${projectName}. A true masterpiece of ${type} design. Featuring ${features}, this space redefines luxury. Experience the lifestyle you deserve today.`;
  }
};

export const analyzeUploads = async (fileCount: number): Promise<string[]> => {
    // Mocking an AI analysis of uploaded images to suggest tags
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(['Modern', 'High Ceiling', 'Natural Light', 'Luxury Material']);
        }, 1500);
    });
};
