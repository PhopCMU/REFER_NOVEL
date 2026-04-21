import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { FeedbackFormValues, FeedbackRating } from "../types/type";

interface SatisfactionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FeedbackFormValues) => Promise<boolean> | boolean;
  submitting?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialValues?: Partial<FeedbackFormValues>;
  closeOnSubmitSuccess?: boolean;
}

const ratingOptions: FeedbackRating[] = [1, 2, 3, 4, 5];

export default function SatisfactionModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  title = "ประเมินความพึงพอใจ",
  description = "กรุณาให้คะแนนการใช้งานระบบของคุณ",
  submitLabel = "ส่งข้อมูล",
  cancelLabel = "ยกเลิก",
  initialValues,
  closeOnSubmitSuccess = true,
}: SatisfactionModalProps) {
  const initialRating = initialValues?.rating ?? null;
  const initialComment = initialValues?.comment ?? "";
  const [rating, setRating] = useState<FeedbackRating | null>(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const validationId = useId();
  const commentFieldId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    setRating(initialRating);
    setComment(initialComment);
    setValidationMessage(null);
  }, [initialComment, initialRating, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!submitting) {
          onClose();
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onClose, open, submitting]);

  const handleRequestClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const handleRatingSelect = (value: FeedbackRating) => {
    setRating(value);

    if (validationMessage) {
      setValidationMessage(null);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rating) {
      setValidationMessage("กรุณาเลือกคะแนนความพึงพอใจก่อนส่งข้อมูล");
      return;
    }

    const didSubmit = await onSubmit({
      rating,
      comment,
    });

    if (didSubmit && closeOnSubmitSuccess) {
      setRating(initialRating);
      setComment(initialComment);
      setValidationMessage(null);
      onClose();
    }
  };

  const describedBy = validationMessage
    ? `${descriptionId} ${validationId}`
    : descriptionId;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
            onClick={handleRequestClose}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4"
          >
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={describedBy}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bg-linear-to-r from-amber-50 via-white to-orange-50 px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-500 shadow-sm">
                      <span aria-hidden="true">★</span>
                    </div>
                    <h2
                      id={titleId}
                      className="text-2xl font-bold text-slate-900"
                    >
                      {title}
                    </h2>
                    <p
                      id={descriptionId}
                      className="mt-2 text-sm text-slate-600"
                    >
                      {description}
                    </p>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleRequestClose}
                    disabled={submitting}
                    aria-label="ปิดหน้าต่างประเมินความพึงพอใจ"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="px-6 pb-6 pt-4">
                <fieldset className="mb-6">
                  <legend className="text-center text-sm font-medium text-slate-700">
                    คะแนนความพึงพอใจ
                  </legend>

                  <div
                    className="mt-4 flex justify-center gap-2"
                    role="group"
                    aria-label="เลือกคะแนนความพึงพอใจ"
                  >
                    {ratingOptions.map((star) => {
                      const isSelected = rating !== null && star <= rating;

                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`ให้คะแนน ${star} ดาว`}
                          aria-pressed={rating === star}
                          onClick={() => handleRatingSelect(star)}
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-3xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                            isSelected
                              ? "bg-amber-50 text-amber-400 shadow-sm shadow-amber-200/60"
                              : "text-slate-300 hover:bg-slate-50 hover:text-amber-300"
                          }`}
                        >
                          <span aria-hidden="true">★</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mb-6">
                  <label
                    htmlFor={commentFieldId}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    ความคิดเห็นเพิ่มเติม (ถ้ามี)
                  </label>
                  <textarea
                    id={commentFieldId}
                    rows={4}
                    maxLength={1000}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="เช่น ระบบใช้งานง่าย แต่ต้องการปรับปรุงหน้าจอบางส่วน..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      ความคิดเห็นของคุณจะถูกนำไปใช้เพื่อปรับปรุงระบบ
                    </p>
                    <p className="text-xs text-slate-400">
                      {comment.length}/1000
                    </p>
                  </div>
                </div>

                <div className="min-h-6" aria-live="polite">
                  {validationMessage && (
                    <p id={validationId} className="text-sm text-rose-500">
                      {validationMessage}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelLabel}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-w-36 items-center justify-center rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังส่ง...
                      </span>
                    ) : (
                      submitLabel
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
