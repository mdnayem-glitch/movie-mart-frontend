"use client";

import React, { useState, useEffect } from "react";
import Button from "@/app/components/Button";
import { FaTimes, FaFilter } from "react-icons/fa";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

const Filter = ({ onFilterChange, initialFilters = {} }) => {
  const [selected, setSelected] = useState({
    date: initialFilters.date || [],
    languages: initialFilters.languages || [],
    categories: initialFilters.categories || [],
    price: initialFilters.price || [],
    categoryId: initialFilters.categoryId || "",
  });

  const [eventCategories, setEventCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [expandedSections, setExpandedSections] = useState({
    date: true,
    languages: false,
    categories: true,
    price: true,
  });

  // Fetch event categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/event-categories?isActive=true&limit=50`,
        );
        if (res.ok) {
          const data = await res.json();
          setEventCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch event categories for filter:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Sync categoryId from parent (URL param changes)
  useEffect(() => {
    setSelected((prev) => ({
      ...prev,
      categoryId: initialFilters.categoryId || "",
    }));
  }, [initialFilters.categoryId]);

  // Notify parent when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(selected);
    }
  }, [selected, onFilterChange]);

  const toggleSelect = (category, value) => {
    setSelected((prev) => {
      const isSelected = prev[category].includes(value);
      return {
        ...prev,
        [category]: isSelected
          ? prev[category].filter((item) => item !== value)
          : [...prev[category], value],
      };
    });
  };

  const selectCategoryId = (id) => {
    setSelected((prev) => ({
      ...prev,
      categoryId: prev.categoryId === id ? "" : id,
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAll = () => {
    setSelected({
      date: [],
      languages: [],
      categories: [],
      price: [],
      categoryId: "",
    });
  };

  const totalFilters =
    Object.entries(selected)
      .filter(([key]) => key !== "categoryId")
      .flatMap(([, v]) => v).length + (selected.categoryId ? 1 : 0);

  // Filter options
  const dates = ["Today", "Tomorrow", "This Weekend"];
  const languages = [
    "Hindi",
    "English",
    "Telugu",
    "Bengali",
    "Kannada",
    "Tamil",
    "Malayalam",
    "Punjabi",
    "Marathi",
    "Gujarati",
  ];
  const price = ["Free", "0–500", "501–1000", "Above 1000"];

  const renderButtons = (category, items, showCount = 10) => {
    const displayItems = expandedSections[category] ? items : items.slice(0, showCount);
    
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {displayItems.map((item, idx) => {
            const isSelected = selected[category].includes(item);
            return (
              <button
                key={idx}
                onClick={() => toggleSelect(category, item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-md"
                    : "border-gray-600 text-gray-300 hover:border-pink-500 hover:text-pink-400"
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            );
          })}
        </div>
        {items.length > showCount && (
          <button
            onClick={() => toggleSection(category)}
            className="text-xs text-pink-400 hover:text-pink-300 mt-2 transition-colors"
          >
            {expandedSections[category] ? "Show less" : `+${items.length - showCount} more`}
          </button>
        )}
      </>
    );
  };

  const FilterSection = ({ title, category, items, showCount = 10 }) => (
    <div className="mb-5 pb-5 border-b border-gray-700/50 last:border-0">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-white text-sm">{title}</span>
        {selected[category].length > 0 && (
          <button
            onClick={() => setSelected((prev) => ({ ...prev, [category]: [] }))}
            className="text-xs text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
          >
            <FaTimes className="w-2.5 h-2.5" />
            Clear ({selected[category].length})
          </button>
        )}
      </div>
      {renderButtons(category, items, showCount)}
    </div>
  );

  return (
    <div className="w-full lg:w-72 border border-gray-700/50 p-4 rounded-2xl shadow-lg bg-white/5 backdrop-blur-sm sticky top-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <FaFilter className="text-pink-400" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          {totalFilters > 0 && (
            <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
              {totalFilters}
            </span>
          )}
        </div>
        {totalFilters > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Filters Tags */}
      {totalFilters > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-700/50">
          <p className="text-xs text-gray-500 mb-2">Applied filters:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(selected)
              .filter(([key]) => key !== "categoryId")
              .map(([category, values]) =>
                values.map((value, idx) => (
                  <span
                    key={`${category}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs"
                  >
                    {value}
                    <button
                      onClick={() => toggleSelect(category, value)}
                      className="hover:text-white"
                    >
                      <FaTimes className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            {selected.categoryId && (() => {
              const cat = eventCategories.find((c) => c._id === selected.categoryId);
              return cat ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">
                  {cat.name}
                  <button onClick={() => selectCategoryId(cat._id)} className="hover:text-white">
                    <FaTimes className="w-2.5 h-2.5" />
                  </button>
                </span>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <FilterSection title="Date" category="date" items={dates} showCount={4} />
      <FilterSection title="Languages" category="languages" items={languages} showCount={6} />

      {/* Dynamic Event Categories */}
      <div className="mb-5 pb-5 border-b border-gray-700/50">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-white text-sm">Event Category</span>
          {selected.categoryId && (
            <button
              onClick={() => selectCategoryId(selected.categoryId)}
              className="text-xs text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
            >
              <FaTimes className="w-2.5 h-2.5" />
              Clear
            </button>
          )}
        </div>
        {categoriesLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-20 bg-gray-700/50 rounded-full animate-pulse" />
            ))}
          </div>
        ) : eventCategories.length === 0 ? (
          <p className="text-xs text-gray-500">No categories available</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {eventCategories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => selectCategoryId(cat._id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
                  selected.categoryId === cat._id
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-md"
                    : "border-gray-600 text-gray-300 hover:border-pink-500 hover:text-pink-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <FilterSection title="Price Range" category="price" items={price} showCount={4} />

      {/* Apply Button for Mobile */}
      <Button 
        className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 lg:hidden"
        onClick={() => {
          // Close drawer on mobile
          if (typeof window !== "undefined") {
            const event = new CustomEvent("closeFilterDrawer");
            window.dispatchEvent(event);
          }
        }}
      >
        Apply Filters {totalFilters > 0 && `(${totalFilters})`}
      </Button>
    </div>
  );
};

export default Filter;
