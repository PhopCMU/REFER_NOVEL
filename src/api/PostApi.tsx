import { AxiosError } from "axios";
import type {
  DataFormLoginProps,
  DataFormSubmitProps,
  FeedbackProps,
  FormPetProp,
  PayloadCreatedOwner,
  PayloadResetPassword,
  PayloadSendLinkResetPassword,
  WorkplacePayload,
} from "../types/type";
import { encryptDataNew } from "../utils/helpers";
import { api, apiWithAuth } from "./Axios";

export const PostLinkResetPassword = async (
  payload: PayloadSendLinkResetPassword,
) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await api.post("/auth/reset-password", {
      encodedData: encyptedDataBody,
    });
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

export const PostNewPassword = async (payload: PayloadResetPassword) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await api.post("/auth/new-password", {
      encodedData: encyptedDataBody,
    });
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

export const PostAddWorksplace = async (payload: WorkplacePayload) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/hospitals/worksplace", {
      encodedData: encyptedDataBody,
    });

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

export const PostFeedback = async (payload: FeedbackProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/feedback", {
      encodedData: encyptedDataBody,
    });

    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostFeedback: ", error.response.data.message);
        return error.response.data.message;
      } else {
        console.error("Error in PostFeedback: ", error.message);
        return error.message;
      }
    }
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

export const PostCreatedOwner = async (payload: PayloadCreatedOwner) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await apiWithAuth.post("/owners/create", {
      encodedData: encyptedDataBody,
    });
    return resp.data;
  } catch (error: any) {
    console.error("Error in PostCreatedOwner: ", error);
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error(
          "Error in PostCreatedOwner: ",
          error.response.data.message,
        );
        return error.response.data.message;
      } else {
        console.error("Error in PostCreatedOwner: ", error.message);
        return error.message;
      }
    }
  }
};

export const PostCreatedPet = async (payload: FormPetProp) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await apiWithAuth.post("/pets/create", {
      encodedData: encyptedDataBody,
    });
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostCreatedAnimal: ", error.response.data);
        return error.response.data;
      } else {
        console.error("Error in PostCreatedAnimal: ", error.message);
        return error.message;
      }
    }
  }
};
