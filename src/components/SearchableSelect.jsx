import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select Option",
  className = "",
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
      // Track scroll events in capturing phase to capture scrolling of table containers
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

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center justify-between text-left cursor-pointer focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15`}
      >
        <span className={value ? "text-slate-900 dark:text-slate-100 truncate pr-2" : "text-slate-400 truncate pr-2"}>
          {value || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
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
            className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/40">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
            </div>
            
            {/* Options List */}
            <div className="max-h-[190px] overflow-y-auto scrollbar-thin py-1 bg-slate-900">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                      opt === value
                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-xs text-slate-500 text-center">
                  No options found
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
