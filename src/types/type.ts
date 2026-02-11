export interface FeedbackProps {
  rating: number;
  comment: string;
  recaptchaToken: string;
}

export interface WorkplacePayload {
  name: string;
  type: string | undefined;
  recaptchaToken: string;
}
