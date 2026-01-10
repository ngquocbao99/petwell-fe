import { ChatMessage } from "../types/chat";

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;



const systemPrompt = {
    role: "user",
    parts: [
        {
            text: `Bạn là một bác sĩ thú y chuyên nghiệp, có hơn 10 năm kinh nghiệm, luôn trả lời chính xác, rõ ràng và có lòng nhân ái. 
Bạn hiểu rõ về các bệnh phổ biến ở chó mèo, lịch tiêm chủng, dinh dưỡng, hành vi, sơ cứu, và chăm sóc sau phẫu thuật. 
Khi khách hàng hỏi, hãy tư vấn cụ thể, ngắn gọn nhưng có dẫn chứng và gợi ý nếu cần gặp bác sĩ trực tiếp.`
        }
    ]
};


export const generateBotResponse = async (chatHistory: ChatMessage[]): Promise<string> => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [systemPrompt, ...chatHistory] })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
};
