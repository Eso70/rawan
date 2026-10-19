import {
  createElement,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

/** Visual recipes stay in the caller's CSS Module; native attributes and refs pass through. */
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};
export function Button({
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return createElement(
    "button",
    {
      ...props,
      type,
      disabled: disabled || loading,
      "aria-busy": loading || props["aria-busy"],
    },
    loading && loadingLabel !== undefined ? loadingLabel : children,
  );
}
export type IconButtonProps = Omit<ButtonProps, "aria-label"> & {
  label: string;
};
export function IconButton({ label, ...props }: IconButtonProps) {
  return createElement(Button, { ...props, "aria-label": label });
}
export type TextInputProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
};
export function TextInput({ type = "text", ...props }: TextInputProps) {
  return createElement("input", { ...props, type });
}
export type SelectionProps = Omit<ComponentPropsWithRef<"input">, "type">;
export function Checkbox(props: SelectionProps) {
  return createElement("input", { ...props, type: "checkbox" });
}
export function Radio(props: SelectionProps) {
  return createElement("input", { ...props, type: "radio" });
}
export type SelectProps = ComponentPropsWithRef<"select">;
export function Select(props: SelectProps) {
  return createElement("select", props);
}
export type FieldErrorProps = Omit<ComponentPropsWithRef<"p">, "role"> & {
  id: string;
};
export function FieldError(props: FieldErrorProps) {
  return createElement("p", { ...props, role: "alert" });
}
