import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  userId: "",
  fullName: "",
  email: "",
  avatar: "",
  role: "",
  phone: "",
  address: "",
  isVerified: false,
  token: "",
  clinicId: "",
};

const userSlice = createSlice({
  name: "user",
  initialState: initialValue,
  reducers: {
    setUserDetails: (state, action) => {
      state.userId = action.payload?.userId || "";
      state.fullName = action.payload?.fullName || "";
      state.email = action.payload?.email || "";
      state.avatar = action.payload?.avatar || "";
      state.role = action.payload?.role || "";
      state.phone = action.payload?.phone || "";
      state.address = action.payload?.address || "";
      state.isVerified = action.payload?.isVerified || false;
      state.token = action.payload?.token || "";
      state.clinicId = action.payload?.clinicId || "";
    },
    updatedAvatar: (state, action) => {
      state.avatar = action.payload || "";
    },
    logout: (state) => {
      Object.assign(state, initialValue);
    },
  },
});

export const { setUserDetails, updatedAvatar, logout } = userSlice.actions;

export default userSlice.reducer;
