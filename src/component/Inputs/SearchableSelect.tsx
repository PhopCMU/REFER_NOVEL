import React, { useState, useRef, useEffect } from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  id?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  icon?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  name,
  id,
  value,
  onChange,
  options,
  placeholder = "ค้นหาหรือเลือก...",
  required = false,
  disabled = false,
  error,
  icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ค้นหาใน label เท่านั้น
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // หา label ของ value ที่เลือก
  const selectedOption =
    options.find((opt) => opt.value === value)?.label || "";

  // จัดการคลิกนอก dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // เมื่อเลือกตัวเลือก
  const handleSelect = (option: SelectOption) => {
    const e = {
      target: { name, value: option.value },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(e);
    setSearchTerm(option.label);
    setIsOpen(false);
  };

  // เมื่อพิมพ์ในช่องค้นหา
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onChange(e); // ส่งค่าไปด้วย (เช่น อาจใช้เป็น string ชั่วคราว)
    setIsOpen(true);
  };

  return (
    <div className={`space-y-1 ${className}`} ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500 pointer-events-none text-xl">
            {icon}
          </span>
        )}

        <input
          type="text"
          value={searchTerm || selectedOption}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md
        ${icon ? "pl-10" : "pl-3"}
        ${
          disabled
            ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            : error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white"
              : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white hover:border-indigo-300"
        }
      `}
          autoComplete="off"
        />

        {/* Dropdown Arrow */}
        <span
          className={`material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 text-gray-400 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          } ${!disabled ? "pointer-events-none" : "opacity-50"}`}
        >
          expand_more
        </span>

        {/* Dropdown List */}
        {isOpen && !disabled && (
          <ul className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2.5 cursor-pointer transition-all duration-150
                ${index !== filteredOptions.length - 1 ? "border-b border-gray-50" : ""}
                hover:bg-gradient-to-r hover:from-indigo-50 hover:to-white hover:pl-5
                text-gray-700 hover:text-indigo-700 font-medium
                active:bg-indigo-100
              `}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-gray-400 italic text-center bg-gray-50">
                <span className="material-symbols-outlined text-base align-text-bottom mr-1">
                  search_off
                </span>
                ไม่พบข้อมูล
              </li>
            )}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;
