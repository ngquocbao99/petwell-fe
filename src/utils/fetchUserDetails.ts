import Axios from "./Axios";
import SummaryApi from "../common/SummarryAPI";

const fetchUserDetails = async (userId: string) => {
  try {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
      throw new Error("No access token found");
    }

    const response = await Axios({
      ...SummaryApi.userDetails(userId),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("check user detail", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

export default fetchUserDetails;
