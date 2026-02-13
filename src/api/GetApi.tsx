import { api } from "./Axios";

export const GetHospitalsWorkplace = async () => {
  try {
    const resp = await api.get(`/hospitals/list`);
    return resp.data;
  } catch (error: any) {
    console.error("Error in GetHospitalsWorkplace:", error);
    return null;
  }
};
