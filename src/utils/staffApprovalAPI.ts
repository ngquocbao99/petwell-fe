import SummaryApi, { baseURL } from "../common/SummarryAPI";

// Get token safely to avoid issues with SSR or execution before DOM is loaded
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accesstoken") || "";
  }
  return "";
};

const staffApprovalAPI = {
  // Get pending staff approval requests
  getPendingRequests: async () => {
    try {
      const token = getToken();

      const response = await fetch(
        baseURL + SummaryApi.staffApproval.getPending.url,
        {
          method: SummaryApi.staffApproval.getPending.method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        console.error("Response not ok:", response.status, response.statusText);
        return {
          success: false,
          data: [],
          message: `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      return {
        success: false,
        data: [],
        message: "Error fetching pending requests",
      };
    }
  },

  // Get processed staff approval requests
  getProcessedRequests: async () => {
    try {
      const token = getToken();

      const response = await fetch(
        baseURL + SummaryApi.staffApproval.getProcessed.url,
        {
          method: SummaryApi.staffApproval.getProcessed.method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        console.error("Response not ok:", response.status, response.statusText);
        return {
          success: false,
          data: [],
          message: `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error fetching processed requests:", err);
      return {
        success: false,
        data: [],
        message: "Error fetching processed requests",
      };
    }
  },

  // Approve a request
  approveRequest: async (requestId: string, staffNote?: string) => {
    try {
      const token = getToken();
      const response = await fetch(
        baseURL + SummaryApi.staffApproval.approve(requestId).url,
        {
          method: SummaryApi.staffApproval.approve(requestId).method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ staffNote }),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error approving request:", err);
      return {
        success: false,
        message: "Error approving request",
      };
    }
  },

  // Reject a request
  rejectRequest: async (requestId: string, staffNote?: string) => {
    try {
      const token = getToken();
      const response = await fetch(
        baseURL + SummaryApi.staffApproval.reject(requestId).url,
        {
          method: SummaryApi.staffApproval.reject(requestId).method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ staffNote }),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error rejecting request:", err);
      return {
        success: false,
        message: "Error rejecting request",
      };
    }
  },
};

export default staffApprovalAPI;
