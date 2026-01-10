import Axios from "./Axios";
import ServiceAPI from "../common/SummarryAPI";

export const fetchServices = async () => {
  try {
    const res = await Axios({ ...ServiceAPI.getAllService });
    return res.data.data;
  } catch (err) {
    console.error("Fetch Services Failed", err);
    return [];
  }
};
