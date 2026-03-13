import { AxiosError } from "axios";
import { apiWithAuth } from "./Axios";
import { encryptDataNew } from "../utils/helpers";

export const DeleteOwner = async (id: string) => {
  try {
    const encryptedDataQuery = encryptDataNew(id);
    const encodedURL = encodeURIComponent(encryptedDataQuery);
    const resp = await apiWithAuth.delete(`/owners/delete?data=${encodedURL}`);
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in DeleteOwner: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in DeleteOwner: ", error.message);
        return error.message;
      }
    }
  }
};

export const DeletePet = async (id: string) => {
  try {
    const encryptedDataQuery = encryptDataNew(id);
    const encodedURL = encodeURIComponent(encryptedDataQuery);
    const resp = await apiWithAuth.delete(`/pets/delete?data=${encodedURL}`);
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in DeleteOwner: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in DeleteOwner: ", error.message);
        return error.message;
      }
    }
  }
};

export const DeleteMedicalFile = async (fileId: string) => {
  try {
    const encryptedDataQuery = encryptDataNew(fileId);
    const encodedURL = encodeURIComponent(encryptedDataQuery);
    const resp = await apiWithAuth.delete(
      `/case/file/delete?data=${encodedURL}`,
    );
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in DeleteOwner: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in DeleteOwner: ", error.message);
        return error.message;
      }
    }
  }

  return { success: true };
};
