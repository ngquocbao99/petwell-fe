import SummaryApi, { baseURL } from "../common/SummarryAPI";
import Axios from "./Axios";

export interface WorkSchedule {
  _id?: string;
  doctorId: {
    _id: string;
    fullName: string;
  };
  storeId: {
    _id: string;
    name: string;
  };
  work_Date: string;
  start_time: string;
  end_time: string;
  status: string;
  swappedWith?: string;
  data?: string;
  success?: boolean;
  message?: string;
}

export const fetchAllSchedules = async (): Promise<WorkSchedule[]> => {
  try {
    const response = await fetch(baseURL + SummaryApi.schedules.getAll.url);
    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      console.error("Failed to fetch schedules:", result.message);
      return [];
    }
  } catch (err) {
    console.error("Error fetching schedules:", err);
    return [];
  }
};

export const createSchedule = async (data: WorkSchedule): Promise<boolean> => {
  try {
    const response = await fetch(baseURL + SummaryApi.schedules.create.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error("Error creating schedule:", err);
    return false;
  }
};

export const updateSchedule = async (
  id: string,
  data: Partial<WorkSchedule>
): Promise<boolean> => {
  try {
    const { url, method } = SummaryApi.schedules.update(id);

    const response = await fetch(baseURL + url, {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error("Error updating schedule:", err);
    return false;
  }
};

export const deleteSchedule = async (id: string): Promise<boolean> => {
  try {
    const { url, method } = SummaryApi.schedules.delete(id);

    const response = await fetch(baseURL + url, {
      method: method.toUpperCase(),
    });

    const result = await response.json();
    return result.success;
  } catch (err) {
    console.error("Error deleting schedule:", err);
    return false;
  }
};

export const fetchAvailableScheduleDoctor = async (): Promise<
  WorkSchedule[]
> => {
  try {
    const response = await Axios(
      SummaryApi.schedules.getAvailableScheduleDoctor
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      console.error("Fetch failed:", response.data.message);
      return [];
    }
  } catch (err) {
    console.error("Error calling API:", err);
    return [];
  }
};

export const registerScheduleDoctor = async (
  id_word: string
): Promise<boolean> => {
  try {
    const res = await Axios({
      ...SummaryApi.schedules.registerWord,
      data: { id_schedule: id_word },
    });

    return res.data.success;
  } catch (err) {
    console.error("Error creating schedule:", err);
    return false;
  }
};

export const fetchMyScheduleDoctor = async (): Promise<WorkSchedule[]> => {
  try {
    const response = await Axios(SummaryApi.schedules.getMyScheduleDoctor);
    if (response.data.success) {
      return response.data.data;
    } else {
      console.error("Failed to fetch schedule:", response.data.message);
      return [];
    }
  } catch (err) {
    console.error("Failed call API:", err);
    return [];
  }
};

export const fetchSwappableSchedules = async (
  scheduleId: string
): Promise<WorkSchedule[]> => {
  const response = await Axios(
    SummaryApi.schedules.getSwappableSchedules(scheduleId)
  );
  return response.data.data || [];
};
