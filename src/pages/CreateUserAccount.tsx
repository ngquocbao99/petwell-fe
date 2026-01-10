import { useState } from "react";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Mail,
  Lock,
  User,
  Shield,
  X,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

import { createUserAccount } from "@utils/UsersAPI";

interface FormData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
}

interface CreateUserFromProps {
  onClose?: () => void;
}

export default function CreateUserAccount({ onClose }: CreateUserFromProps) {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
    role: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const adminToken = "mock-token";

  const validRoles = [
    {
      value: "customer",
      label: "Customer",
      icon: User,
      color: "bg-gradient-to-br from-blue-200 to-blue-400",
      description: "Regular user access",
    },
    // {
    //     value: "doctor",
    //     label: "Doctor",
    //     icon: Shield,
    //     color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    //     description: "Medical professional",
    // },
    // {
    //     value: "staff",
    //     label: "Staff",
    //     icon: Users,
    //     color: "bg-gradient-to-br from-orange-500 to-orange-600",
    //     description: "Support team member",
    // },
    {
      value: "manager",
      label: "Manager",
      icon: Sparkles,
      color: "bg-gradient-to-br from-purple-200 to-purple-400",
      description: "Administrative access",
    },
  ];

  // Hàm tạo mật khẩu ngẫu nhiên 12 ký tự
  const generateRandomPassword = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";

    // Đảm bảo có ít nhất 1 ký tự từ mỗi loại
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)]; // 1 chữ hoa
    password += lowercase[Math.floor(Math.random() * lowercase.length)]; // 1 chữ thường
    password += numbers[Math.floor(Math.random() * numbers.length)]; // 1 số

    // Thêm 8 ký tự ngẫu nhiên nữa để đủ 12 ký tự
    const allChars = uppercase + lowercase + numbers;
    for (let i = 0; i < 9; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Xáo trộn mật khẩu để không theo thứ tự cố định
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData((prev) => ({ ...prev, password: newPassword }));
    // Xóa lỗi password khi generate mới
    setErrors((prev) => ({ ...prev, password: undefined }));
    if (message) setMessage(null);
  };

  const validateField = (
    field: keyof FormData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "fullName":
        if (!value.trim()) {
          return "Full name is required!";
        }
        if (value.trim().length < 2) {
          return "Full name must be at least 2 characters";
        }
        if (value.trim().length > 50) {
          return "Full name must be less than 50 characters";
        }
        // Kiểm tra chỉ cho phép chữ cái, dấu cách và dấu
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!nameRegex.test(value.trim())) {
          return "Full name must only contain letters and spaces";
        }
        break;

      case "email":
        if (!value.trim()) {
          return "Email is required!";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return "Email is not valid!";
        }
        if (value.trim().length > 100) {
          return "Email must be less than 100 characters";
        }
        break;

      case "password":
        if (!value.trim()) {
          return "Password is required!";
        }
        if (value.length < 6) {
          return "Password must be at least 6 characters";
        }
        if (value.length > 50) {
          return "Password must be less than 50 characters";
        }
        break;

      case "role":
        if (!value) {
          return "Please select a role";
        }
        const validRoleValues = validRoles.map((role) => role.value);
        if (!validRoleValues.includes(value)) {
          return "Role is not valid!";
        }
        break;
    }
    return undefined;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate field khi user nhập
    const fieldError = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
    }));

    if (message) setMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate tất cả fields
    Object.keys(formData).forEach((field) => {
      const fieldKey = field as keyof FormData;
      const fieldError = validateField(fieldKey, formData[fieldKey]);
      if (fieldError) {
        newErrors[fieldKey] = fieldError;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const showToast = (message: string, type: "success" | "error") => {
    // Tạo toast element
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`;

    toast.innerHTML = `
      <div class="flex items-center gap-3">
        ${
          type === "success"
            ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
            : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
        }
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Hiển thị toast
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // showToast("Please check and fix the errors in the form", "error");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const data = await createUserAccount(formData, adminToken);

      if (data.success) {
        showToast(
          `Account created successfully for ${formData.fullName}!`,
          "success"
        );
        setFormData({
          email: "",
          password: "",
          fullName: "",
          role: "",
        });
        setErrors({});
      } else {
        // Handle specific API error messages
        const errorMessage =
          data.message ||
          data.error ||
          "Cannot create account. Please try again.";
        setMessage({ type: "error", text: errorMessage });
      }
    } catch (error: any) {
      // Handle network errors or other exceptions
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "",
    });
    setErrors({});
    setMessage(null);
  };

  const getInputClassName = (fieldName: keyof FormData) => {
    const baseClasses =
      "w-full h-10 pl-11 pr-4 rounded-xl border-2 focus:outline-none focus:ring-2 disabled:bg-gray-100 transition-all duration-200 bg-white";
    const hasError = errors[fieldName];

    if (hasError) {
      return `${baseClasses} border-red-400 focus:ring-red-200 focus:border-red-500`;
    }

    return `${baseClasses} border-gray-300 focus:ring-blue-200 focus:border-blue-500`;
  };

  return (
    <div className="relative bg-white rounded-2xl  shadow-2xl max-w-3xl w-full mx-3">
      {/* Header với gradient xanh */}
      <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-t-2xl px-4 py-3">
        <div className="absolute inset-0 bg-black/10 rounded-t-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Create User Account
              </h1>
              <p className="text-blue-100 text-sm">
                Add a new team member to your organization
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Content với background trắng */}
      <div className="p-3 bg-white rounded-b-2xl">
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-3 border-l-4 ${
              message.type === "error"
                ? "bg-red-50 border-red-400 text-red-800"
                : "bg-green-50 border-green-400 text-green-800"
            }`}
            role="alert"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2" noValidate>
          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-xl p-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    disabled={isLoading}
                    className={getInputClassName("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="email@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isLoading}
                    className={getInputClassName("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-purple-50 rounded-xl p-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Password Setup
            </h3>
            <div className="space-y-2">
              {formData.password ? (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    readOnly
                    className="w-full h-10 pl-11 pr-11 rounded-xl border-2 border-purple-200 bg-purple-100 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={isLoading}
                className="w-full h-10 px-4 flex items-center justify-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-100 hover:bg-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-50 transition-all duration-200 font-medium text-purple-700"
              >
                <RefreshCw className="h-4 w-4" />
                {formData.password
                  ? "Generate New Password"
                  : "Generate Random Password"}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Role Selection Section */}
          <div className="bg-green-50 rounded-xl p-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Role Assignment
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {validRoles.map((role) => {
                const IconComponent = role.icon;
                const isSelected = formData.role === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleInputChange("role", role.value)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-center group ${
                      isSelected
                        ? "border-green-400 bg-green-100 shadow-lg scale-105"
                        : "border-green-100 hover:border-green-300 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${role.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {role.label}
                    </h4>
                    <p className="text-xs text-gray-600">{role.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.role}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 bg-gray-50 rounded-xl p-1">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="flex-1 h-9 px-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-9 px-3 flex items-center justify-center rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="mt-1 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Email Verification Required
              </p>
              <p className="text-sm text-blue-700 mt-1">
                A verification email will be sent to the user. They will need to
                set a new password on their first login. The generated password
                is temporary and secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
