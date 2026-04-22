import { useCallback, useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { PostFeedback } from "../api/PostApi";
import type { FeedbackFormValues, FeedbackProps } from "../types/type";
import { showToast } from "../utils/showToast";

const FEEDBACK_SUCCESS_MESSAGE = "ส่งสำเร็จ! ขอบคุณสำหรับความคิดเห็นของคุณ!";
const FEEDBACK_ERROR_MESSAGE = "เกิดข้อผิดพลาดในการส่งความคิดเห็น";

export function useFeedbackSubmission(): {
  isSubmitting: boolean;
  submitFeedback: (values: FeedbackFormValues) => Promise<boolean>;
} {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = useCallback(
    async ({ rating, comment }: FeedbackFormValues): Promise<boolean> => {
      if (!executeRecaptcha) {
        showToast.error("ไม่สามารถโหลด reCAPTCHA ได้ ลองใหม่อีกครั้ง");
        return false;
      }

      setIsSubmitting(true);

      try {
        const recaptchaToken = await executeRecaptcha("feedback");

        if (!recaptchaToken) {
          showToast.error("ยืนยัน reCAPTCHA ไม่สำเร็จ");
          return false;
        }

        const payload: FeedbackProps = {
          rating,
          comment: comment.trim(),
          recaptchaToken,
        };

        const response = await PostFeedback(payload);

        if (!response) {
          showToast.error(FEEDBACK_ERROR_MESSAGE);
          return false;
        }

        showToast.success(FEEDBACK_SUCCESS_MESSAGE);
        return true;
      } catch {
        showToast.error(FEEDBACK_ERROR_MESSAGE);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha],
  );

  return { isSubmitting, submitFeedback };
}
