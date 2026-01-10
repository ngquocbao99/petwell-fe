import { useState } from "react";
import bgPattern from "@assets/bg-login.png";
import SummaryApi from "@common/SummarryAPI";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { setUserDetails } from "@store/userSlice";
import { useDispatch } from "react-redux";
import Axios from "@utils/Axios";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  // Validate password
  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate on change
    const validationError = name === 'email'
      ? validateEmail(value)
      : validatePassword(value);

    setErrors(prev => ({
      ...prev,
      [name]: validationError,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(data.email),
      password: validatePassword(data.password),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.login,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      });
      if (response.data.success) {
        toast.success("Welcome back! Login successful");
        const token = response.data.data.token;
        localStorage.setItem("accesstoken", response.data.data.token);
        const userId = response.data.data.user.id;
        localStorage.setItem("userId", userId);
        localStorage.setItem("accesstoken", token);
        const userData = response.data.data.user;
        
        dispatch(
          setUserDetails({
            userId: userId,
            fullName: userData.fullName || userData.name || "",
            email: userData.email || "",
            avatar: userData.avatar || "",
            role: userData.role || "",
            phone: userData.phone || "",
            address: userData.address || "",
            isVerified: userData.isVerified || false,
            token: token,
            clinicId: userData.clinicId || "",
          })
        );

        // Clear form
        setData({ email: "", password: "" });
        window.dispatchEvent(new Event("user-login"));
        switch (response.data.data.user.role.toLowerCase()) {
          case "admin":
            navigate("/dashboard/manager");
            break;
          case "manager":
            navigate("/dashboard/manager");
            break;
          case "doctor":
            navigate("/dashboard/manager");
            break;
          case "staff":
            navigate("/dashboard/manager");
            break;
          default:
            navigate("/");
            break;
        }
      }
    } catch (error: any) {

      toast.error(error?.response?.data?.message);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      const idToken = credentialResponse?.credential;

      if (!idToken) {
        toast.error("Google ID token is missing!");
        return;
      }

      const response = await Axios.post("/api/v1/auth/google-login", {
        idToken,
      });
      if (response.data.token) {
        localStorage.setItem("userId", response.data.user._id);
        const userData = response.data.user;
        
        dispatch(
          setUserDetails({
            userId: response.data.user._id,
            fullName: userData.fullName || userData.name || "",
            email: userData.email || "",
            avatar: userData.avatar || "",
            role: userData.role || "",
            phone: userData.phone || "",
            address: userData.address || "",
            isVerified: userData.isVerified || false,
            token: response.data.token,
            clinicId: userData.clinicId || "",
          })
        );

        toast.success("Login with Google successful!");
        localStorage.setItem("accesstoken", response.data.token);
        window.dispatchEvent(new Event("user-login"));
        navigate("/");
      } else {
        toast.error("Google login failed.");
      }
    } catch (error: any) {
      toast.error("Server error during Google login.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        background: "linear-gradient(135deg, #fdf1e6 0%, #fdebd0 100%)",
      }}
    >
      <Toaster position="top-center" reverseOrder={false} />

      <img
        src={bgPattern}
        alt="Pet Pattern"
        className="absolute opacity-10 w-full h-full object-cover"
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative z-10"
        noValidate
      >
        <h2 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Login to Pet Well
        </h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="text"
            name="email"
            autoComplete="email"
            value={data.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-orange-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={data.password}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:border-orange-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded transition"
        >
          Sign In
        </button>
        <div className="mt-4">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => toast.error("Google login failed")}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?
          <a
            href="/auth/register"
            className="text-orange-500 hover:underline ml-1"
          >
            Sign Up
          </a>
        </p>
        <p className="text-center text-sm text-gray-600 mt-4">
          <a
            href="/auth/forgot-password"
            className="text-orange-500 hover:underline ml-1"
          >
            Forgot Password?
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
