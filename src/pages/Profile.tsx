import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@store/store";
import { setUserDetails } from "../store/userSlice";
import toast from "react-hot-toast";
import Axios from "@utils/Axios";
import SummaryApi from "@common/SummarryAPI";
import fetchUserDetails from "@utils/fetchUserDetails";
import { changePasswordAPI } from "@utils/profile";

const Profile = () => {
  const dispatch = useDispatch();
  const userFromStore = useSelector((state: RootState) => state.user);

  const [user, setUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);

      const token = localStorage.getItem("accesstoken");
      const userId = localStorage.getItem("userId") || userFromStore.userId;

      if (!token || !userId) {
        toast.error("Authentication information missing!");
        setLoading(false);
        return;
      }
      setUser({
        userId,
        token,
      });

      try {
        const userData = await fetchUserDetails(userId);

        if (userData && userData.success) {
          const profileData = userData.data;

          setUser({
            ...profileData,
            token,
            userId: userId,
          });

          setFormData({
            fullName: profileData.fullName || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
            avatar: profileData.avatar || "",
          });

          setAvatarPreview(profileData.avatar || "");

          dispatch(
            setUserDetails({
              ...profileData,
              token,
              userId: userId,
            })
          );
        } else {
          toast.error("Failed to load profile data");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile");
      }

      setLoading(false);
    };

    fetchProfile();
  }, [dispatch, userFromStore.userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user?.userId) {
      toast.error("User information not found!");
      setLoading(false);
      return;
    }

    let updatedAvatarUrl = formData.avatar;

    if (selectedAvatarFile) {
      const formDataUpload = new FormData();
      formDataUpload.append("image", selectedAvatarFile);

      try {
        const res = await Axios.post("/api/v1/upload/", formDataUpload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (res.data.success && res.data.data.url) {
          updatedAvatarUrl = res.data.data.url;
        } else {
          setSelectedAvatarFile(null);
          toast.error("Upload Image Fail!");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        toast.error("Error uploading image!");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await Axios({
        ...SummaryApi.updateProfile(user.userId),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        data: { ...formData, avatar: updatedAvatarUrl },
      });

      if (response.data.success) {
        toast.success("Information updated successfully!");

        const updatedUserData = {
          ...response.data.data,
          token: user.token,
          userId: user.userId,
        };

        setUser(updatedUserData);
        dispatch(setUserDetails(updatedUserData));
        setSelectedAvatarFile(null);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating information");
    }

    setLoading(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validatePasswordForm = () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;
    const errors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    };

    let valid = true;

    if (!oldPassword.trim()) {
      errors.oldPassword = "Current password is required";
      valid = false;
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
      valid = false;
    } else if (newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
      valid = false;
    }

    if (newPassword && oldPassword && newPassword === oldPassword) {
      errors.newPassword =
        "New password must be different from current password";
      valid = false;
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required";
      valid = false;
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setPasswordErrors(errors);
    return valid;
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitted with:", passwordData);

    console.log("Password submit triggered");
    console.log("Current user:", user);
    console.log("Password data:", {
      oldPassword: passwordData.oldPassword ? "***" : "",
      newPassword: passwordData.newPassword ? "***" : "",
      confirmPassword: passwordData.confirmPassword ? "***" : "",
    });
    setPasswordErrors({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });

    if (!validatePasswordForm()) {
      console.log("Validation failed");
      return;
    }

    if (!user?.userId || !user?.token) {
      toast.error("User not found or token missing.");
      return;
    }

    setPasswordLoading(true);

    try {
      console.log("Calling changePasswordAPI with:", {
        userId: user.userId,
        token: user.token ? "***" : "missing",
      });

      const response = await changePasswordAPI(
        user.userId,
        passwordData,
        user.token
      );

      console.log("Password change response:", response);

      if (response.success) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);

        // Reset form
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
          general: "",
        });
      } else {
        const errorMessage = response.message || "Password change failed";
        toast.error(errorMessage);
        setPasswordErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));
      }
    } catch (err: any) {
      console.error("Error changing password:", err);

      let errorMessage = "Something went wrong";
      let fieldError = "";

      if (err.message) {
        if (err.message.includes("Old password is incorrect")) {
          fieldError = "oldPassword";
          errorMessage = "Current password is incorrect";
        } else if (err.message.includes("All fields are required")) {
          errorMessage = "All fields are required";
        } else if (err.message.includes("do not match")) {
          fieldError = "confirmPassword";
          errorMessage = "Passwords do not match";
        } else {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage);

      if (fieldError) {
        setPasswordErrors((prev) => ({
          ...prev,
          [fieldError]: errorMessage,
        }));
      } else {
        setPasswordErrors((prev) => ({
          ...prev,
          general: errorMessage,
        }));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });
  };

  // Loading state
  if (loading && !user) {
    return (
      <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md flex items-center justify-center border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md flex flex-col lg:flex-row gap-10 items-center border"
      >
        {/* Ảnh đại diện */}
        <div className="flex flex-col items-center w-full lg:w-1/3">
          <div className="relative group">
            <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md"
              onError={(e) => (e.currentTarget.src = "/default-avatar.png")}
            />
            <label
              htmlFor="avatarUpload"
              className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full cursor-pointer hover:bg-orange-600"
            >
              📷
            </label>
            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Form thông tin */}
        <div className="w-full lg:w-2/3 space-y-5">
          <h2 className="text-xl font-extrabold text-orange-500">
            PERSONAL INFORMATION
          </h2>

          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500"
          />
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400"
          />

          <div className="flex justify-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg shadow disabled:opacity-50"
            >
              {loading ? "WAITING..." : "UPDATE"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-1 rounded-lg shadow"
            >
              CHANGE PASSWORD
            </button>
          </div>
        </div>
      </form>

      {/* Modal đổi mật khẩu */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-orange-500">
                  CHANGE PASSWORD
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Enter your current password and create a new one
                </p>
              </div>

              {/* General Error Message */}
              {passwordErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {passwordErrors.general}
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors ${
                      passwordErrors.oldPassword
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 hover:text-orange-500"
                  >
                    {showOldPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.oldPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors ${
                      passwordErrors.newPassword
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 hover:text-orange-500"
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors ${
                      passwordErrors.confirmPassword
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-600 hover:text-orange-500"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Password Requirements:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Different from current password</li>
                  <li>• Must match confirmation password</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {passwordLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
