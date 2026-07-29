"use client";
import Link from "next/link";
import React, { useState } from "react";
import { FaUserCircle, FaUser } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Button from "@/app/components/Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import toast from "react-hot-toast";
import { useGetEventsQuery } from "../../../store/eventsApi";
import { useGetMoviesQuery } from "../../../store/moviesApi";

const ProfileDrawer = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { data: eventsData } = useGetEventsQuery();
  const { data: moviesData } = useGetMoviesQuery();

  const movies = moviesData?.data || [];
  const events = eventsData?.data || [];

  const latestMovies = movies.slice(-5);
  const latestEvents = events.slice(-5);

  const notificationCount = latestMovies.length + latestEvents.length;
  // helper to close drawer on link click
  const handleLinkClick = (href) => {
    setOpen(false);
    router.push(href);
  };

  // Handle logout
  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (!isAuthenticated) return "Guest";
    if (user?.name) return user.name.split(" ")[0]; // First name only
    if (user?.email) return user.email.split("@")[0];
    if (user?.phone) return user.phone;
    return "User";
  };

  return (
    <>
      {/* Trigger */}
      <div
        className="flex items-center space-x-2 cursor-pointer z-50 "
        onClick={() => setOpen(true)}
      >
        {isAuthenticated && user?.img ? (
          <Image
            src={user.img}
            alt="Profile"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border-2 border-pink-500"
          />
        ) : (
          <FaUserCircle className="text-2xl" />
        )}
        <span className="hidden sm:inline text-sm">
          Hi, {loading ? "..." : getDisplayName()}
        </span>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[#13162f] shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.img ? (
                <Image
                  src={user.img}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-pink-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{getDisplayName()}</p>
                <p className="text-xs text-gray-400">
                  {user?.email || (user?.phone ? `+91 ${user.phone}` : "")}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-semibold">Welcome!</h2>
          )}
          <button
            onClick={() => setOpen(false)}
            className="ml-2 sm:ml-3 text-2xl text-gray-300 hover:text-white cursor-pointer bg-red-500 rounded-full p-1"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Login prompt for guests */}
        {!isAuthenticated && (
          <div className="p-4 border-b border-gray-700">
            <p className="text-gray-400 text-sm mb-3">
              Login to access your bookings and more
            </p>
            <Button
              onClick={() => handleLinkClick("/login")}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
            >
              Login / Register
            </Button>
          </div>
        )}

        {/* Content */}
        <div
          className="p-4 space-y-4 text-sm overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <ul className="space-y-2">
            {[
              // {
              //   href: "/notification",
              //   label: "🔔 Notifications",
              //   badge: notificationCount,
              // },

              // { href: "/my-bookmark", label: "📦 My Bookmark" },
              // { href: "/my-booking-tickets", label: "🎬 My Booking Tickets" },
              { href: "/help", label: "❓ Help & Support" },
              { href: "/privacy", label: "🔒 Privacy policy" },
              { href: "/terms", label: "📜 Terms & Conditions" },
              {
                href: "/cancellation-refund",
                label: "💳 Cancellation & Refund Policy",
              },
              {
                href: "/partner-terms",
                label: "🤝 Partner Terms and Conditions",
              },
              { href: "/about-us", label: "ℹ️ About Us" },
              { href: "/contact-us", label: "📞 Contact Us" },
              // { href: "/vendor-policy", label: "📜 Vendor Policy" },
              {
                href: "/profile-settings",
                label: "⚙️ Accounts & Settings",
                requireAuth: true,
              },
              {
                href: "/become-vendor",
                label: "🚀 Partner With Us",
                highlight: true,
              },
            ].map((item) => {
              // Skip auth-required items for guests
              if (item.requireAuth && !isAuthenticated) return null;

              return (
                <li
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={`flex items-center justify-between cursor-pointer px-3 py-3 rounded-lg transition-colors ${
                    item.highlight
                      ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 hover:from-pink-500/30 hover:to-purple-500/30"
                      : "hover:bg-gray-700/50"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        {isAuthenticated && (
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-700 bg-[#13162f]">
            <Button
              onClick={handleLogout}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400"
            >
              🚪 Sign Out
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileDrawer;
