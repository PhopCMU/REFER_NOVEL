import { AxiosError } from "axios";
import type {
  DataFormLoginProps,
  DataFormSubmitProps,
  FeedbackProps,
  FormPetProp,
  PayloadCreatedOwner,
  PayloadResetPassword,
  PayloadSendLinkResetPassword,
  PostReferralPayload,
  PostReferralPayloadEncrypted,
  UpdateAppointmentPayloadEncrypted,
  UpdateCaseStatusProps,
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

export const PostAddUpdateWorksplaceVet = async (a: string[]) => {
  try {
    const encyptedDataBody = encryptDataNew(a);

    const resp = await apiWithAuth.post("/hospitals/worksplace/update", {
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

export const PostFeedback = async (
  payload: FeedbackProps,
): Promise<unknown | null> => {
  try {
    const encyptedDataBody = encryptDataNew(payload);

    const resp = await api.post("/feedback", {
      encodedData: encyptedDataBody,
    });

    return resp.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostFeedback: ", error.response.data.message);
        return null;
      } else {
        console.error("Error in PostFeedback: ", error.message);
        return null;
      }
    }

    return null;
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

export const PostReferralCases = async (payload: PostReferralPayload) => {
  try {
    // ✅ 1. เข้ารหัสเฉพาะ Metadata (Text/JSON) ด้วย function เดิม
    const encryptedMetadata = encryptDataNew(payload.metadata);

    // ✅ 2. สร้าง FormData สำหรับ multipart/form-data
    const formData = new FormData();

    // ใส่ Metadata ที่เข้ารหัสแล้ว
    formData.append("encodedData", encryptedMetadata);

    // ✅ 3. ใส่ไฟล์ Binary พร้อมข้อมูลจับคู่ (ใช้ clientIndex + category)
    payload.files.forEach((file, index) => {
      // ส่งไฟล์ Binary (ชื่อไฟล์เดิมเพื่อให้ง่ายต่อการ debug)
      formData.append("files", file, file.name);

      // ✅ ส่ง metadata ของไฟล์นี้แยกเป็น field สำหรับจับคู่
      formData.append(`files[${index}][clientIndex]`, index.toString());
      formData.append(
        `files[${index}][category]`,
        payload.metadata.files[index]?.category || "",
      );
      formData.append(
        `files[${index}][originalName]`,
        payload.metadata.files[index]?.name || "",
      );
      formData.append(
        `files[${index}][mimeType]`,
        payload.metadata.files[index]?.mimeType || "",
      );
      formData.append(
        `files[${index}][sizeBytes]`,
        payload.metadata.files[index]?.sizeBytes.toString() || "0",
      );
      formData.append(
        `files[${index}][fileExtension]`,
        payload.metadata.files[index]?.fileExtension || "",
      );
    });

    // ✅ 4. ส่ง Request (เพิ่ม timeout สำหรับไฟล์ใหญ่)
    const resp = await apiWithAuth.post("/case/referral-cases", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 นาที
    });

    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostReferralCases: ", error.response.data);
        return error.response.data;
      } else {
        console.error("Error in PostReferralCases: ", error.message);
        return error.message;
      }
    }
    throw error;
  }
};

export const PostMedicalFile = async (formData: FormData) => {
  try {
    const resp = await apiWithAuth.post("/case/medical-file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostReferralCases: ", error.response.data);
        return error.response.data;
      } else {
        console.error("Error in PostReferralCases: ", error.message);
        return error.message;
      }
    }
  }
};

export const PostUpdateCaseStatus = async (payload: UpdateCaseStatusProps) => {
  try {
    const encyptedDataBody = encryptDataNew(payload);
    const resp = await apiWithAuth.post("/case/counter/update-case-status", {
      encodedData: encyptedDataBody,
    });
    return resp.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error("Error in PostReferralCases: ", error.response.data);
        return error.response.data;
      } else {
        console.error("Error in PostReferralCases: ", error.message);
        return error.message;
      }
    }
    throw error;
  }
};

export const PostAppointment = async (
  payload: PostReferralPayloadEncrypted,
) => {
  try {
    const formData = new FormData();

    // ส่ง caseId ที่เข้ารหัส
    const encryptedMetadata = encryptDataNew(payload);
    formData.append("encodedData", encryptedMetadata);

    // ส่งไฟล์จริง (ไฟล์เดียว)
    formData.append("files", payload.files[0]);

    const resp = await apiWithAuth.post(
      "/case/referral-appointment",
      formData,
      { timeout: 120000 },
    );

    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return error.response?.data || { success: false };
    }
    throw error;
  }
};

export const PostUpdateAppointment = async (
  payload: UpdateAppointmentPayloadEncrypted,
) => {
  try {
    const formData = new FormData();
    const encryptedMetadata = encryptDataNew(payload);

    formData.append("encodedData", encryptedMetadata);

    if (payload.files[0]) {
      formData.append("files", payload.files[0]);
    }

    const resp = await apiWithAuth.put(
      "/case/counter/file/referral-appointment/update",
      formData,
      {
        timeout: 120000,
      },
    );

    return resp.data;
  } catch (error: any) {
    if (error instanceof AxiosError) {
      return error.response?.data || { success: false };
    }
    throw error;
  }
};
