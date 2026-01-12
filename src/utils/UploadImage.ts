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
            throw new Error('Only image files are accepted');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (image.size > maxSize) {
            throw new Error('Image size must not exceed 5MB');
        }

        const formData = new FormData()
        formData.append('image', image)

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

        if (response.data?.success && response.data?.data?.secure_url) {
            return response.data.data.secure_url;
        } else {
            console.error('Upload response error:', response.data);
            throw new Error('Upload failed: No image URL returned');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        if (error instanceof Error) {
            throw new Error(`Image upload error: ${error.message}`);
        }
        throw new Error('An error occurred while uploading the image');
    }
}

export default uploadImage;