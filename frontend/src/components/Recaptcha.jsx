import { forwardRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

export const Recaptcha = forwardRef(function Recaptcha({ onChange, onExpired }, ref) {
  const handleChange = (token) => {
    onChange?.(token);
    if (!token) onExpired?.();
  };

  if (!SITE_KEY) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        Add VITE_RECAPTCHA_SITE_KEY to .env for captcha.
      </p>
    );
  }

  return (
    <ReCAPTCHA
      ref={ref}
      sitekey={SITE_KEY}
      onChange={handleChange}
      onExpired={onExpired}
      theme="light"
      size="normal"
    />
  );
});
