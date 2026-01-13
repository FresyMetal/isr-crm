import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface ValidatedInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  validate?: (value: string) => { valid: boolean; error?: string };
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function ValidatedInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  validate,
  placeholder,
  required = false,
  className = "",
}: ValidatedInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // Solo validar si el campo ha sido tocado y tiene validación
    if (touched && validate && value) {
      const result = validate(value);
      setError(result.error);
    } else if (!value) {
      setError(undefined);
    }
  }, [value, validate, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validate && value) {
      const result = validate(value);
      setError(result.error);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
