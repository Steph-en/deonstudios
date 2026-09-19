import React, { useState, useRef, useEffect } from 'react';

interface CategoryFilterDropdownProps {
  activeCategory: string;
  categories: string[];
  onSelectCategory: (category: string) => void;
  idPrefix?: string;
}

export const CategoryFilterDropdown: React.FC<CategoryFilterDropdownProps> = ({
  activeCategory,
  categories,
  onSelectCategory,
  idPrefix = 'filter',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // The options shown in the dropdown are all categories EXCEPT the currently selected one
  const remainingOptions = categories.filter((cat) => cat !== activeCategory);

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      {/* 
        Editorial trigger button matching the "View All" pattern in Projects:
        Clean underlined active category (e.g., "ALL", "EDITORIAL") with three horizontal dots.
        Underline extends continuously across both the category text and the dots.
      */}
      <button
        id={`${idPrefix}-category-trigger`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="group inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] uppercase tracking-[0.2em] font-medium text-neutral-800 hover:text-black border-b border-neutral-800 group-hover:border-black pb-[3px] transition-colors duration-200 cursor-pointer focus:outline-hidden"
        title="Filter categories"
      >
        <span>{activeCategory}</span>
        <span
          aria-hidden="true"
          className="inline-flex items-center text-[11px] sm:text-[12px] font-mono leading-none tracking-widest text-neutral-700 group-hover:text-black transition-colors select-none"
        >
          ···
        </span>
      </button>

      {/* 
        Dropdown Menu:
        Displays the remaining categories in a clean editorial frame.
        Selecting an option sets it as active (and moves the previously active category back into this list).
      */}
      {isOpen && (
        <div
          id={`${idPrefix}-category-dropdown`}
          className="absolute right-0 top-full mt-3 w-40 sm:w-44 bg-neutral-50 border border-neutral-300 shadow-md py-1.5 z-50 animate-in fade-in duration-150"
          role="menu"
        >
          {remainingOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectCategory(cat);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            >
              <span className="hover:underline underline-offset-4 decoration-neutral-400">
                {cat}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilterDropdown;
