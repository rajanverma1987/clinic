'use client';

import { Input } from '@/components/ui/Input';
import { useEffect, useRef, useState } from 'react';

export function MedicineSearchInput({
  drugs,
  value,
  onChange,
  onSelect,
  placeholder = 'Search medicine...',
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = drugs
        .filter(
          (drug) =>
            drug.name?.toLowerCase().includes(query) ||
            drug.strength?.toLowerCase().includes(query) ||
            drug.form?.toLowerCase().includes(query)
        )
        .slice(0, 10); // Limit to 10 results
      setFilteredDrugs(filtered);
      setShowDropdown(true);
    } else {
      setFilteredDrugs([]);
      setShowDropdown(false);
    }
  }, [searchQuery, drugs]);

  useEffect(() => {
    // If value is set and matches a drug, show its name
    if (value && drugs.length > 0) {
      const selectedDrug = drugs.find((d) => String(d._id).trim() === String(value).trim());
      if (selectedDrug) {
        setSearchQuery(
          `${selectedDrug.name}${selectedDrug.strength ? ` (${selectedDrug.strength})` : ''}${
            selectedDrug.form ? ` [${selectedDrug.form}]` : ''
          }`
        );
      }
    }
  }, [value, drugs]);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);
    
    // If input is cleared, clear selection
    if (!query.trim()) {
      onChange('');
      onSelect(null);
    }
  };

  const handleSelect = (drug) => {
    setSearchQuery(
      `${drug.name}${drug.strength ? ` (${drug.strength})` : ''}${
        drug.form ? ` [${drug.form}]` : ''
      }`
    );
    onChange(drug._id);
    onSelect(drug);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredDrugs.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredDrugs.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredDrugs.length) {
          handleSelect(filteredDrugs[selectedIndex]);
        } else if (filteredDrugs.length === 1) {
          handleSelect(filteredDrugs[0]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <Input
        ref={inputRef}
        type='text'
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (filteredDrugs.length > 0) {
            setShowDropdown(true);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && filteredDrugs.length > 0 && (
        <div
          ref={dropdownRef}
          className='mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'
          style={{ zIndex: 10060 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredDrugs.map((drug, index) => (
            <div
              key={drug._id}
              className={`px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors ${
                index === selectedIndex ? 'bg-primary-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === filteredDrugs.length - 1 ? 'rounded-b-lg' : ''
              }`}
              onClick={() => handleSelect(drug)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className='font-medium text-neutral-900'>{drug.name}</div>
              <div className='text-sm text-neutral-600'>
                {drug.strength && <span>{drug.strength}</span>}
                {drug.strength && drug.form && <span> • </span>}
                {drug.form && <span>{drug.form}</span>}
                {drug.manufacturer && (
                  <>
                    <span> • </span>
                    <span>{drug.manufacturer}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showDropdown && searchQuery.trim() && filteredDrugs.length === 0 && (
        <div className='mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center text-neutral-500' style={{ zIndex: 10060 }}>
          No medicines found
        </div>
      )}
    </div>
  );
}
