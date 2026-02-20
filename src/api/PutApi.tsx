import { AxiosError } from "axios";
import type { FormPetProp, PayloadUpdateOwner } from "../types/type";
import { encryptDataNew } from "../utils/helpers";
import { apiWithAuth } from "./Axios";

export const PutUpdateOwner = async (payload: PayloadUpdateOwner) => {
  try {
    const encryptedDataQuery = encryptDataNew(payload);
    const encodedURL = encodeURIComponent(encryptedDataQuery);
    const resp = await apiWithAuth.put(`/owners/update?data=${encodedURL}`);
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PutUpdateOwner: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in PutUpdateOwner: ", error.message);
        return error.message;
      }
    }
  }
};

export const PutUpdatePet = async (payload: FormPetProp) => {
  try {
    const encryptedDataQuery = encryptDataNew(payload);
    const encodedURL = encodeURIComponent(encryptedDataQuery);
    const resp = await apiWithAuth.put(`/pets/update?data=${encodedURL}`);
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PutUpdatePet: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in PutUpdatePet: ", error.message);
        return error.message;
      }
    }
  }
};
