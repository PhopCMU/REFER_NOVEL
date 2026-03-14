// src/components/Inputs/Select.tsx
import React from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  id?: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
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

        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-linear-to-r from-gray-50 to-white appearance-none transition-all duration-200
            ${icon ? "pl-10" : "pl-3"}
            ${disabled ? "bg-gray-100 text-gray-500" : ""}
            ${error ? "border-red-500 focus:ring-red-500" : ""}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow Icon (แทนที่ลูกศรเดิม) */}
        <span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
          expand_more
        </span>
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Select;
