import { AxiosError } from "axios";
import { api, apiWithAuth } from "./Axios";
import type { PayloadFetchOwner } from "../types/type";
import { encryptDataNew } from "../utils/helpers";

export const GetHospitalsWorkplace = async () => {
  try {
    const resp = await api.get(`/hospitals/list`);
    return resp.data;
  } catch (error: any) {
    console.error("Error in GetHospitalsWorkplace:", error);
    return null;
  }
};

export const GetOwners = async (paylaod: PayloadFetchOwner) => {
  try {
    const encyptedDataQuery = encryptDataNew(paylaod);
    const encodedURL = encodeURIComponent(encyptedDataQuery);
    const resp = await apiWithAuth.get(`/owners?data=${encodedURL}`);
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(
          "Error in PostAddWorksplace: ",
          error.response.data.message,
        );
        return error.response.data.message;
      } else {
        console.error("Error in PostAddWorksplace: ", error.message);
        return error.message;
      }
    }
  }
};
