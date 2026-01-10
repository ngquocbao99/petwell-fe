import Axios from "./Axios";
import SummaryApi from "../common/SummarryAPI";

export const changePasswordAPI = async (
  userId: string,
  passwordData: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
  token: string
) => {
  try {
    const response = await Axios({
      ...SummaryApi.changePassword(userId),
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: passwordData,
    });

    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
