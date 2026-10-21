import { TextInput, type TextInputProps } from "./controls";
import styles from "./form-input.module.css";

export function FormInput({ className, ...props }: TextInputProps) {
  return <TextInput {...props} className={[styles.input, className].filter(Boolean).join(" ")} />;
}
