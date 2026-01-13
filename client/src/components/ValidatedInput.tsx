import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface ValidatedInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  validate?: (value: string) => ValidationResult | Promise<ValidationResult>;
  placeholder?: string;
  type?: string;
  className?: string;
  debounceMs?: number;
}

export function ValidatedInput({
  id,
  value,
  onChange,
  validate,
  placeholder,
  type = "text",
  className = "",
  debounceMs = 300,
}: ValidatedInputProps) {
  const [error, setError] = useState<string | undefined>();
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current as any);
    }

    // Solo validar si el campo ha sido tocado y tiene validación
    if (touched && validate && value) {
      setIsValidating(true);
      
      debounceTimeout.current = setTimeout(async () => {
        try {
          const result = await validate(value);
          setError(result.isValid ? undefined : result.message);
        } catch (err) {
          console.error("Validation error:", err);
          setError("Error al validar");
        } finally {
          setIsValidating(false);
        }
      }, debounceMs);
    } else if (!value) {
      setError(undefined);
      setIsValidating(false);
    }

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current as any);
      }
    };
  }, [value, validate, touched, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className={className}>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={error ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
        />
        {isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
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
