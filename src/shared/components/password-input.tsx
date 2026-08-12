"use client";

import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeOffIcon } from "@/shared/components/icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Extra right padding is applied so text does not sit under the toggle. */
  inputClassName?: string;
};

export function PasswordInput({
  className,
  inputClassName,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <span className={["relative block", className].filter(Boolean).join(" ")}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={[inputClassName, "pr-11"].filter(Boolean).join(" ")}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setVisible((v) => !v);
        }}
        aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
        className="absolute top-1/2 right-2.5 z-10 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-foreground"
      >
        {visible ? (
          <EyeOffIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </button>
    </span>
  );
}
