import { ReactNode, memo } from "react";
import { Input } from "./input";

interface LabelWithInputProps {
  label: string;
  value: string | number;
  onChange: (e: any) => void;
  isPassword?: boolean;
  placeholder?: string;
  type?: "text" | "password" | "number" | "textarea";
  required?: boolean;
  icon?: ReactNode;
  rows?: number;
  min?: number;
  max?: number;
  className?: string;
}

export default memo(function LabelWithInput({ label, isPassword = false, value, onChange, placeholder = "", type = "text", required = false, icon, rows = 4, min, max, className = "" }: LabelWithInputProps) {
  const inputType = isPassword ? "password" : type; return (<div className={className}> <label className="block text-sm font-medium text-foreground mb-2"> {label} </label>

    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          className="w-full px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono text-sm bg-background text-foreground placeholder:text-muted-foreground"
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <Input
          type={inputType}
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground`}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
        />
      )}
    </div>
  </div>
  );
})

