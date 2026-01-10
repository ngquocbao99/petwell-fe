import { ChatMessage } from "../types/chat";

export const vetTrainingSamples: ChatMessage[] = [
  {
    role: "user",
    parts: [{ text: "Chó bị nôn và bỏ ăn, em phải làm gì?" }]
  },
  {
    role: "model",
    parts: [{ text: "Nên cho chó nhịn ăn 12 giờ, uống nước điện giải. Nếu tiếp tục nôn, hãy đưa đến bác sĩ thú y." }]
  },
  {
    role: "user",
    parts: [{ text: "Mèo bị gãy chân có cần phẫu thuật không?" }]
  },
  {
    role: "model",
    parts: [{ text: "Có thể cần. Nếu gãy nặng, bác sĩ sẽ chụp X-quang và chỉ định nẹp hoặc phẫu thuật." }]
  },
  {
    role: "user",
    parts: [{ text: "Mèo bị chảy nước mắt liên tục là bị gì?" }]
  },
  {
    role: "model",
    parts: [{ text: "Có thể do viêm kết mạc, dị ứng hoặc nhiễm trùng hô hấp. Nên dùng nước muối sinh lý vệ sinh và khám nếu kéo dài." }]
  },
  {
    role: "user",
    parts: [{ text: "Mèo bỏ ăn 2 ngày, có nguy hiểm không?" }]
  },
  {
    role: "model",
    parts: [{ text: "Mèo bỏ ăn lâu có thể suy gan. Nên kiểm tra nhiệt độ, dấu hiệu mất nước và đưa đi bác sĩ nếu không ăn sau 48h." }]
  },
  {
    role: "user",
    parts: [{ text: "Mèo có thể bị giun không và cách phòng tránh?" }]
  },
  {
    role: "model",
    parts: [{ text: "Có. Nên tẩy giun định kỳ mỗi 3 tháng. Tránh để mèo ăn thịt sống, chuột hoặc tiếp xúc phân mèo khác." }]
  },
  {
    role: "user",
    parts: [{ text: "Chó bị tiêu chảy kèm theo nôn, có nguy hiểm không?" }]
  },
  {
    role: "model",
    parts: [{ text: "Có thể là dấu hiệu viêm ruột, ngộ độc hoặc Parvo. Cần nhịn ăn, cho uống nước điện giải, nếu không cải thiện sau 24h, nên đi khám ngay." }]
  },
  {
    role: "user",
    parts: [{ text: "Chó bị ho khan, có phải bị viêm phổi không?" }]
  },
  {
    role: "model",
    parts: [{ text: "Có thể do viêm khí quản hoặc viêm phổi. Nên cách ly, giữ ấm và đưa đi bác sĩ nếu ho kéo dài quá 2 ngày." }]
  },
  {
    role: "user",
    parts: [{ text: "Chó con bao nhiêu tuổi thì tiêm phòng lần đầu?" }]
  },
  {
    role: "model",
    parts: [{ text: "Thông thường chó con tiêm mũi đầu tiên vào lúc 6–8 tuần tuổi, sau đó tiêm nhắc lại theo lịch thú y." }]
  },
];
