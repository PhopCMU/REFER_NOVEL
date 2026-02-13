import { AxiosError } from "axios";
import type {
  DataFormLoginProps,
  DataFormSubmitProps,
  FeedbackProps,
  WorkplacePayload,
} from "../types/type";
import { encryptDataNew } from "../utils/helpers";
import { api } from "./Axios";

// export const PostResetPassword = async (
//     email: string,
//     recaptchaToken: string,
//     vis
// ): Promise<> => {

// }

export const PostAddWorksplace = async (payload: WorkplacePayload) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/hospitals/worksplace", {
      encodedData: encyptedDataBody,
    });

    return resp.data;
  } catch (error: any) {
    console.error("Error in PostAddWorksplace:", error.message);
    return error.response.data.message;
  }
};

export const PostFeedback = async (payload: FeedbackProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/feedback", {
      encodedData: encyptedDataBody,
    });

    return resp.data;
  } catch (error: any) {
    console.error("Error in PostFeedback:", error.message);
    return error.response.data.message;
  }
};

export const PostRegister = async (payload: DataFormSubmitProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await api.post("/auth/register", {
      encodedData: encyptedDataBody,
    });
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostRegister: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in PostRegister: ", error.message);
        return error.message;
      }
    }
  }
};

export const PostLogin = async (payload: DataFormLoginProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await api.post("/auth/login", {
      encodedData: encyptedDataBody,
    });
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostLogin: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in PostLogin: ", error.message);
        return error.message;
      }
    }
  }
};
