"use client";

import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, Thumbs } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";

import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

// Service-specific configuration: endpoint, label, image field, title field, link builder
const SERVICE_CONFIG = {
  "film-trade": {
    label: "Film Trade",
    endpoint: "/movies?sortBy=createdAt&sortOrder=desc&limit=3",
    imageField: "posterUrl",
    titleField: "title",
    buildLink: (item) => `/film-mart-details/${item._id}`,
    viewAllLink: "/film-mart",
  },
  events: {
    label: "Events",
    endpoint: "/events?sortBy=createdAt&sortOrder=desc&limit=3",
    imageField: "posterImage",
    titleField: "title",
    buildLink: (item) => `/events/${item._id}`,
    viewAllLink: "/events",
  },
  "watch-movies": {
    label: "Watch Movies",
    endpoint: "/watch-videos?sortBy=createdAt&sortOrder=desc&limit=3",
    imageField: "thumbnailUrl",
    titleField: "title",
    buildLink: (item) => `/watch-movie-deatils?id=${item._id}`,
    viewAllLink: "/watch-movies",
  },
};

const ServiceHeroBanner = ({ service }) => {
  const config = SERVICE_CONFIG[service];
  const [items, setItems] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    if (!config) return;
    let isCancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}${config.endpoint}`);
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        if (!isCancelled) {
          const mapped = list
            .map((item) => ({
              _id: item._id,
              image: item?.[config.imageField],
              title: item?.[config.titleField],
              href: config.buildLink(item),
            }))
            .filter((i) => !!i.image);
          setItems(mapped);
        }
      } catch (err) {
        console.error(`Failed to load ${service} banner data:`, err);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [service]);

  if (!config || items.length === 0) return null;

  return (
    <section className="w-full relative py-4">
      {/* MAIN HERO */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay, Thumbs]}
        thumbs={{ swiper: thumbsSwiper }}
        loop={items.length > 1}
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        className="hero-swiper"
      >
        {items.map((slide) => (
          <SwiperSlide key={slide._id}>
            <Link href={slide.href || "#"}>
              {/* FULL WIDTH IMAGE */}
              <div
                className="relative w-full h-[220px] md:h-[420px] lg:h-[520px] xl:h-[600px] bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                {/* LEFT GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                {/* SERVICE LABEL + TITLE */}
                <div className="absolute left-4 md:left-10 bottom-10 md:bottom-16 z-10 max-w-[80%] md:max-w-[55%]">
                  <span className="inline-block bg-red-600/90 text-white text-[10px] md:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 md:mb-3">
                    {config.label}
                  </span>
                  {slide.title && (
                    <h2 className="text-white text-lg md:text-3xl lg:text-4xl font-bold drop-shadow-lg line-clamp-2">
                      {slide.title}
                    </h2>
                  )}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* THUMBNAIL PREVIEW (BOTTOM RIGHT) */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 w-[65%] md:w-[45%] lg:w-[30%]">
          <Swiper
            modules={[Thumbs]}
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={Math.min(items.length, 4)}
            watchSlidesProgress
            className="thumb-swiper pr-10"
          >
            {items.map((slide) => (
              <SwiperSlide key={slide._id}>
                <div
                  className="h-14 md:h-16 lg:h-20 rounded-lg overflow-hidden cursor-pointer border border-white/20"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            onClick={() => thumbsSwiper?.slidePrev()}
            className="absolute cursor-pointer top-1/2 left-[-12px] z-20 -translate-y-1/2 bg-black/70 text-white rounded-full px-2 py-1 text-sm hover:bg-black"
          >
            ❮
          </button>

          <button
            onClick={() => thumbsSwiper?.slideNext()}
            className="absolute cursor-pointer top-1/2 right-[-12px] z-20 -translate-y-1/2 bg-black/70 text-white rounded-full px-2 py-1 text-sm hover:bg-black"
          >
            ❯
          </button>
        </div>
      )}

      <style jsx>{`
        :global(.hero-swiper .swiper-pagination) {
          bottom: 20px;
        }

        :global(.swiper-pagination-bullet) {
          background: #ccc;
        }

        :global(.swiper-pagination-bullet-active) {
          background: #f59e0b;
        }

        :global(.thumb-swiper .swiper-slide-thumb-active) {
          border: 2px solid #f59e0b;
        }
      `}</style>
    </section>
  );
};

export default ServiceHeroBanner;
