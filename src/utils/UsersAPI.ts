import Axios from "@utils/Axios"; // Make sure to use the correct path for Axios
import SummaryApi from "@common/SummarryAPI"; // Correct path for SummaryAPI

export const fetchAllUsers = async () => {
  try {
    const response = await Axios({
      ...SummaryApi.user.getAllUsers, // Using the configuration for getAllUsers API
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Return the data after checking its structure
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data; // Return the array of users
    } else {
      console.error("Unexpected response structure:", response.data);
      throw new Error("Unexpected response structure");
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error; // Propagate the error to be caught in the component
  }
};

// Update blockUnblockUser to accept the token as an argument
export const blockUnblockUser = async (
  userId: string,
  isBlock: boolean,
  token: string
) => {
  try {
    const response = await Axios({
      ...SummaryApi.user.blockUnblockUser, // Endpoint configuration
      url: SummaryApi.user.blockUnblockUser.url.replace(":userId", userId), // Replace dynamic userId
      headers: {
        Authorization: `Bearer ${token}`, // Pass token in Authorization header
        "Content-Type": "application/json",
      },
      data: { isBlock }, // Send the isBlock flag
    });

    return response.data; // Return the server response data
  } catch (error) {
    console.error("Error in block/unblock user:", error);
    throw error; // Rethrow the error to be caught by the calling function
  }
};
// ✅ Create user account (admin)
export const createUserAccount = async (
  userData: {
    email: string;
    password: string;
    fullName: string;
    role: string;
  },
  token: string
) => {
  try {
    const response = await Axios({
      ...SummaryApi.user.createUserAccount,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: userData,
    });

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong while creating user account.";

    // Ghi rõ lỗi, dễ debug
    console.error("Error creating user account:", message);

    // Ném lỗi cụ thể để component xử lý
    throw new Error(message);
  }
};
