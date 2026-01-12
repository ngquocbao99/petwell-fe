import SummaryApi, { baseURL } from "../common/SummarryAPI";

// Get token safely to avoid issues with SSR or execution before DOM is loaded
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accesstoken") || "";
  }
  return "";
};

export const fetchAvailableAppointments = async () => {
  try {
    const token = getToken();
    const response = await fetch(
      baseURL + SummaryApi.DoctorAppointment.getAll.url,
      {
        method: SummaryApi.DoctorAppointment.getAll.method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    const result = await response.json();
    // Trả về đúng format object
    return result;
  } catch (err) {
    console.error("Error fetching Doctor Appointment:", err);
    return {
      success: false,
      data: [],
      message: "Error fetching Doctor Appointment",
    };
  }
};

// Lấy các appointment của doctor đã nhận, đang pending, đã tiến hành
export const fetchAppointmentsForDoctor = async (id: string) => {
  if (!id || id === "null" || id === "undefined") {
    console.error("doctorId is missing or invalid:", id);
    return {
      success: false,
      data: [],
      message: "Doctor ID is missing or invalid",
    };
  }
  try {
    const token = getToken();
    const url = `${baseURL}${SummaryApi.DoctorAppointment.getById(id).url}`;
    const res = await fetch(url, {
      method: SummaryApi.DoctorAppointment.getById(id).method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("Error fetching appointments for doctor:", err);
    return {
      success: false,
      data: [],
      message: "Error fetching appointments for doctor",
    };
  }
};

export const acceptDoctorAppointment = async (
  doctorId: string,
  appointmentId: string
) => {
  try {
    const token = getToken();
    const url = `${baseURL}/api/v1/doctor-appointments/accept/${doctorId}/${appointmentId}`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("Error accepting appointment:", err);
    return { success: false, message: "Error accepting appointment" };
  }
};

export const submitDiagnosisResult = async (
  appointmentId: string,
  diagnosisData: {
    healthCondition: string;
    diagnosis: string;
    treatment?: string;
    testResults?: string[] | string;
    treatmentRecommendations?: string;
    reExaminationDate?: Date | string;
    medications?: Array<{
      name: string;
      dosage: string;
      duration: string;
      note?: string;
    }>;
    instructions?: string;
    pdfUrl?: string;
  }
) => {
  try {
    const token = getToken();
    const url = `${baseURL}/api/v1/appointment/submit-diagnosis/${appointmentId}`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(diagnosisData),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error("Error submitting diagnosis result:", err);
    return {
      success: false,
      message: "Error submitting diagnosis result",
    };
  }
};
