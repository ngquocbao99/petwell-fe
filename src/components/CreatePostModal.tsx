import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import Axios from "@utils/Axios";
import { createPost } from "@utils/fetchFroumPost";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    title: string;
    content: string;
    images?: string[];
    isPublic?: boolean;
    tags?: string[];
    type: string;
  }) => void;
  activeCategory: string;
  initialData?: {
    title: string;
    content: string;
    images?: string[];
    tags?: string[];
  };
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeCategory,
  initialData,
}) => {
  const [newPost, setNewPost] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    tags: initialData?.tags || [],
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images || []
  );
  const [errors, setErrors] = useState({
    title: false,
    content: false,
  });
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNewPost({
        title: initialData.title || "",
        content: initialData.content || "",
        tags: initialData.tags || [],
      });
      setImagePreviews(initialData.images || []);
      setSelectedImages([]);
    }
  }, [initialData, isOpen]);

  const handleCancel = () => {
    // Reset form
    setNewPost({
      title: "",
      content: "",
      tags: [],
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setErrors({
      title: false,
      content: false,
    });
    setIsTagDropdownOpen(false);
    onClose();
  };

  const availableTags = [
    // Chăm sóc sức khỏe
    "Sức khỏe",
    "Bệnh tật",
    "Tiêm phòng",
    "Khám bệnh",
    "Dinh dưỡng",

    // Huấn luyện & Hành vi
    "Huấn luyện",
    "Hành vi",
    "Vệ sinh",
    "Vâng lời",

    // Chăm sóc & Vệ sinh
    "Tắm rửa",
    "Chải lông",
    "Cắt móng",
    "Vệ sinh răng miệng",

    // Hoạt động & Giải trí
    "Vui chơi",
    "Dạo chơi",
    "Tập thể dục",
    "Đồ chơi",

    // Phụ kiện & Đồ dùng
    "Thức ăn",
    "Phụ kiện",
    "Đồ dùng",
    "Chuồng/ổ",

    // Cộng đồng & Sự kiện
    "Hẹn hò",
    "Sự kiện",
    "Hội nhóm",
    "Chia sẻ kinh nghiệm",

    // Khác
    "Hỏi đáp",
    "Tư vấn",
    "Cảm xúc",
    "Kỷ niệm",
  ];

  const toggleTag = (tag: string) => {
    setNewPost((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validateForm = () => {
    const newErrors = {
      title: !newPost.title.trim(),
      content: !newPost.content.trim(),
    };
    setErrors(newErrors);
    return !newErrors.title && !newErrors.content;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Kiểm tra loại file
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      toast.error("Please upload only image files!");
      return;
    }

    if (files.length + selectedImages.length > 5) {
      toast.error("Maximum 5 images allowed!");
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // Nếu là ảnh mới (blob:), xóa khỏi selectedImages
    if (imagePreviews[index].startsWith("blob:")) {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      setIsCreating(true);
      let uploadedImages: string[] = [];

      // Upload ảnh mới (blob)
      if (selectedImages.length > 0) {
        try {
          const uploadPromises = selectedImages.map(async (image) => {
            const formData = new FormData();
            formData.append("image", image);

            const uploadRes = await Axios.post("/api/v1/upload", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            if (uploadRes.data.success && uploadRes.data.data.url) {
              return uploadRes.data.data.url;
            }
            throw new Error("Upload failed");
          });

          uploadedImages = await Promise.all(uploadPromises);
        } catch (err) {
          toast.error("Error uploading images!");
          setIsCreating(false);
          return;
        }
      }

      // Lấy các ảnh cũ (không phải blob:) còn lại
      const oldImages = imagePreviews.filter((url) => !url.startsWith("blob:"));

      // Gộp ảnh cũ còn giữ + ảnh mới vừa upload
      const postData = {
        ...newPost,
        tags: newPost.tags,
        isPublic: true,
        type: activeCategory,
        images: [...oldImages, ...uploadedImages],
      };

      onSuccess(postData);
      toast.success(
        initialData
          ? "Post updated successfully!"
          : "Post created successfully!"
      );

      // Reset form
      setNewPost({ title: "", content: "", tags: [] });
      setSelectedImages([]);
      setImagePreviews([]);
      onClose();
    } catch (error) {
      toast.error(
        initialData ? "Failed to update post!" : "Failed to create post!"
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">
          {initialData ? "Edit Post" : "Create New Post"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => {
                setNewPost({ ...newPost, title: e.target.value });
                setErrors((prev) => ({ ...prev, title: false }));
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ffb366] focus:border-transparent ${
                errors.title ? "border-red-500" : ""
              }`}
              placeholder="Enter post title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">Title is required</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newPost.content}
              onChange={(e) => {
                setNewPost({ ...newPost, content: e.target.value });
                setErrors((prev) => ({ ...prev, content: false }));
              }}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ffb366] focus:border-transparent min-h-[200px] ${
                errors.content ? "border-red-500" : ""
              }`}
              placeholder="Enter post content"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">Content is required</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="w-full border rounded-lg px-3 py-2 text-left focus:ring-2 focus:ring-[#ffb366] focus:border-transparent flex items-center justify-between"
              >
                <span className="text-gray-500">
                  {newPost.tags.length > 0
                    ? `${newPost.tags.length} tags selected`
                    : "Select tags"}
                </span>
                <Plus className="w-5 h-5 text-gray-400" />
              </button>

              {isTagDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                    >
                      <span>{tag}</span>
                      {newPost.tags.includes(tag) && (
                        <Check className="w-5 h-5 text-[#ffb366]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {newPost.tags && newPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newPost.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-[#ffb366] text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images (maximum 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#ffb366]">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Plus className="w-6 h-6 text-gray-400" />
                </label>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            className="px-4 py-2 bg-[#ffb366] text-white rounded-lg hover:bg-[#ffa64d] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {initialData ? "Saving Changes..." : "Creating Post..."}
              </span>
            ) : initialData ? (
              "Save Changes"
            ) : (
              "Create Post"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
