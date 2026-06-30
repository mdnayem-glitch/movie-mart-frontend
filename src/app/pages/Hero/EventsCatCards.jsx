"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

const EventsCatCards = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/event-categories?isActive=true`,
        );
        if (response.ok) {
          const data = await response.json();
          const list = data.data || [];
          setCategories(list);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch event categories:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-7 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="relative bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-lg border border-gray-700 
                            flex flex-col items-center justify-center p-3 md:p-4 animate-pulse"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gray-700 rounded-full mb-2" />
              <div className="w-16 h-2 bg-gray-700 rounded mb-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div className="w-full py-6 text-center text-gray-500 text-sm">
        No event categories available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-7 gap-3">
        {categories.map((cat) => (
          <Link key={cat._id} href={`/events?categoryId=${cat._id}`}>
            <div
              className="relative bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-lg border border-gray-700 
                            flex flex-col items-center justify-center p-3 md:p-4 hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain mb-2"
              />
              <h3 className="text-[10px] md:text-xs font-bold text-yellow-300 uppercase tracking-wide text-center">
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventsCatCards;
