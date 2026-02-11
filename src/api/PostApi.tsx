import type { FeedbackProps, WorkplacePayload } from "../types/type";
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
  } catch (err: any) {
    console.log("Error in PostAddWorksplace:", err.message);
    return null;
  }
};

export const PostFeedback = async (payload: FeedbackProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/feedback", {
      encodedData: encyptedDataBody,
    });

    return resp.data;
  } catch (err: any) {
    console.log("Error in PostFeedback:", err.message);
    return null;
  }
};
