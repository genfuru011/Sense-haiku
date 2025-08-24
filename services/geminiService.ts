
import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const haikuSchema = {
  type: Type.OBJECT,
  properties: {
    line1: {
      type: Type.STRING,
      description: "俳句の最初の五音の部分。厳密に五音で構成すること。"
    },
    line2: {
      type: Type.STRING,
      description: "俳句の七音の部分。厳密に七音で構成すること。"
    },
    line3: {
      type: Type.STRING,
      description: "俳句の最後の五音の部分。厳密に五音で構成すること。"
    }
  },
  required: ["line1", "line2", "line3"],
};

export const generateHaikuFromText = async (text: string): Promise<{ line1: string; line2: string; line3: string; }> => {
  if (!ai || !process.env.API_KEY) {
    // Simulate AI response if API key is not available
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      line1: "APIキー",
      line2: "なくて詠めない",
      line3: "夏の空",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `以下の文章から、情景が目に浮かぶような美しい五七五の俳句を生成してください。\n\nテーマ: "${text}"`,
      config: {
        systemInstruction: "あなたはプロの俳人です。与えられた文章やテーマから、情景が目に浮かぶような、感動的で美しい五七五の俳句を生成してください。必ず、厳密に五音、七音、五音のリズムを守ってください。季語を入れるよう努めてください。",
        responseMimeType: "application/json",
        responseSchema: haikuSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const generatedHaiku = JSON.parse(jsonString);

    return {
        line1: generatedHaiku.line1 || "生成失敗",
        line2: generatedHaiku.line2 || "五七五の",
        line3: generatedHaiku.line3 || "言葉見つからず",
    };

  } catch (error) {
    console.error("Error generating haiku:", error);
    throw new Error("AIによる俳句の生成に失敗しました。");
  }
};
