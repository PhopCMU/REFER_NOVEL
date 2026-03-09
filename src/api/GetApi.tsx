import { AxiosError } from "axios";
import { api, apiWithAuth } from "./Axios";
import type { GetReferralCasesProps, PayloadFetchOwner } from "../types/type";
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

export const GetOwners = async (payload: PayloadFetchOwner) => {
  try {
    const encyptedDataQuery = encryptDataNew(payload);
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

export const GetCaseReferral = async (payload: GetReferralCasesProps) => {
  try {
    const encyptedDataQuery = encryptDataNew(payload);
    const encodedURL = encodeURIComponent(encyptedDataQuery);
    const resp = await apiWithAuth.get(
      `/case/cases-referrals?data=${encodedURL}`,
    );
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(
          "Error in GetCaseReferral: ",
          error.response.data.message,
        );
        return error.response.data.message;
      } else {
        console.error("Error in GetCaseReferral: ", error.message);
        return error.message;
      }
    }
  }
};

export const GetCaseReferralAdmin = async (payload: GetReferralCasesProps) => {
  try {
    const encyptedDataQuery = encryptDataNew(payload);
    const encodedURL = encodeURIComponent(encyptedDataQuery);
    const resp = await apiWithAuth.get(
      `/case/counter/cases-referrals?data=${encodedURL}`,
    );
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(
          "Error in GetCaseReferral: ",
          error.response.data.message,
        );
        return error.response.data.message;
      } else {
        console.error("Error in GetCaseReferral: ", error.message);
        return error.message;
      }
    }
  }
};

export const GetHospitalData = async (limits: number, year: number) => {
  try {
    const payload = { limits, year };

    const encyptedDataQuery = encryptDataNew(payload);
    const encodedURL = encodeURIComponent(encyptedDataQuery);
    const resp = await apiWithAuth.get(
      `/hospitals/list/admin?data=${encodedURL}`,
    );
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(
          "Error in GetHospitalData: ",
          error.response.data.message,
        );
        return error.response.data.message;
      } else {
        console.error("Error in GetHospitalData: ", error.message);
        return error.message;
      }
    }
  }
};
