import React from "react";

interface InputProps {
  label: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  id?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  name,
  id,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  error,
  icon,
  className = "",
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-linear-to-r from-gray-50 to-white transition-all duration-200
            ${icon ? "pl-10" : "pl-3"}
            ${disabled ? "bg-gray-100 text-gray-500" : ""}
            ${error ? "border-red-500 focus:ring-red-500" : ""}
          `}
        />
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Input;
