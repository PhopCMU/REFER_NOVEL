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
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 pointer-events-none">
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
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gradient-to-r from-gray-50 to-white transition-all duration-200 cursor-pointer
            ${icon ? "pl-10" : "pl-3"}
            ${disabled ? "bg-gray-100 text-gray-500" : ""}
            ${error ? "border-red-500 focus:ring-red-500" : ""}
          `}
          autoComplete="off"
        />

        {/* Dropdown Arrow */}
        <span
          className={`material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>

        {/* Dropdown List */}
        {isOpen && (
          <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700 hover:text-indigo-700"
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500 italic">ไม่พบข้อมูล</li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
