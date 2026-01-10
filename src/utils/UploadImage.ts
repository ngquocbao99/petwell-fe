import SummaryApi from "../common/SummarryAPI"
import Axios from "./Axios"

interface UploadResponse {
    success: boolean;
    message: string;
    data: {
        secure_url: string;
        url: string;
        // Các trường khác...
    };
}

const uploadImage = async (image: File): Promise<string> => {
    try {
        // Validate file type
        if (!image.type.startsWith('image/')) {
            throw new Error('Chỉ chấp nhận file ảnh');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
            throw new Error('Kích thước ảnh không được vượt quá 5MB');
        }

        const formData = new FormData()
        formData.append('image', image)

        console.log('Uploading image...');
        const response = await Axios.post<UploadResponse>(
            SummaryApi.uploadImage.url,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('accesstoken')}`
                }
            }
        );

        console.log('Upload response:', response.data);

        if (response.data?.success && response.data?.data?.secure_url) {
            console.log('Image URL:', response.data.data.secure_url);
            return response.data.data.secure_url;
        } else {
            console.error('Upload response error:', response.data);
            throw new Error('Upload failed: No image URL returned');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        if (error instanceof Error) {
            throw new Error(`Lỗi tải ảnh: ${error.message}`);
        }
        throw new Error('Có lỗi xảy ra khi tải ảnh');
    }
}

export default uploadImage;