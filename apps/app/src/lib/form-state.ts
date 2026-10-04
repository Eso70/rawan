export interface FormState {
  error?: string;
  success?: string;
}
export type FormAction = (
  state: FormState,
  form: FormData,
) => Promise<FormState>;
