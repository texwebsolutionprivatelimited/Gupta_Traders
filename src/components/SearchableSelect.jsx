import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { PenLine } from "lucide-react";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select Option",
  className = "",
  allowCustom = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpwards: false });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 250; // Total approximate height of the dropdown portal
      const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      
      let top;
      if (openUpwards) {
        top = rect.top + scrollY - dropdownHeight - 4;
      } else {
        top = rect.bottom + scrollY + 4;
      }

      setCoords({
        top,
        left: rect.left + scrollX,
        width: rect.width,
        openUpwards,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter((opt) => {
    const optStr = typeof opt === 'string' ? opt : (opt?.label || opt?.name || '');
    return optStr.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        const first = typeof filteredOptions[0] === 'string' ? filteredOptions[0] : (filteredOptions[0]?.value || filteredOptions[0]?.label);
        handleSelect(first);
      } else if (allowCustom && search.trim()) {
        handleSelect(search.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const hasExactMatch = safeOptions.some((opt) => {
    const optStr = typeof opt === 'string' ? opt : (opt?.label || opt?.name || '');
    return optStr.toLowerCase() === search.trim().toLowerCase();
  });

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center justify-between text-left cursor-pointer focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15`}
      >
        <span className={value ? "text-slate-900 dark:text-slate-100 font-medium truncate pr-2" : "text-slate-400 truncate pr-2"}>
          {value || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="flex flex-col bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border-0 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2.5 bg-[#f8fafc]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={allowCustom ? "Search or type custom..." : "Search..."}
                className="w-full px-3 py-2 text-xs bg-white rounded-lg text-[#0f172a] placeholder-[#94a3b8] border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] focus:outline-none focus:shadow-[0_0_0_2px_#3b82f6]"
                autoFocus
              />
            </div>
            
            {/* Options List */}
            <div className="max-h-[220px] overflow-y-auto scrollbar-thin py-1 bg-white">
              {/* Option to use custom text if typed and not an exact match */}
              {allowCustom && search.trim() && !hasExactMatch && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left px-3.5 py-2 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <PenLine size={13} className="shrink-0 text-amber-800" />
                  <span className="truncate">Type manually: <strong>"{search.trim()}"</strong></span>
                </button>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const optLabel = typeof opt === 'string' ? opt : (opt?.label || opt?.name);
                  const optVal = typeof opt === 'string' ? opt : (opt?.value ?? opt?.label ?? opt?.name);
                  return (
                    <button
                      key={optVal}
                      type="button"
                      onClick={() => handleSelect(optVal)}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                        optVal === value
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-[#1e293b] hover:bg-[#f8fafc] hover:text-[#0f172a] font-medium"
                      }`}
                    >
                      {optLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-3 text-xs text-[#64748b] text-center">
                  {allowCustom && search.trim() ? (
                    <span>Press <strong>Enter</strong> to use "{search.trim()}"</span>
                  ) : (
                    <span>No options found</span>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
