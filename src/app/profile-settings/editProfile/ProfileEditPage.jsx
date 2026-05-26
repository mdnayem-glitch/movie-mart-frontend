"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowLeft,
  FaCamera,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/app/components/Button";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Image from "next/image";
import toast from "react-hot-toast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/api";

const ProfileEditPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'password'
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "password" &&
      (user?.authProvider === "local" || !user?.authProvider)
    ) {
      setActiveTab("password");
    }
  }, [searchParams, user?.authProvider]);

  // Profile form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      if (user.img) setPhoto(user.img);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };

  // Check if field is editable based on auth provider
  // Phone users can't edit phone (their login method), but can edit email
  // Google/Local users can't edit email (their login method), but can edit phone
  const canEditPhone = user?.authProvider !== "phone";
  const canEditEmail = user?.authProvider === "phone"; // Only phone users can add/edit email
  const canChangePassword =
    user?.authProvider === "local" || !user?.authProvider;

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);

      // Only send phone if user can edit it
      if (canEditPhone && formData.phone) {
        formDataToSend.append("phone", formData.phone);
      }

      // Only send email if user can edit it
      if (canEditEmail && formData.email) {
        formDataToSend.append("email", formData.email);
      }

      // Add image if changed
      if (photoFile) {
        formDataToSend.append("img", photoFile);
      }

      const response = await fetch(`${API_URL}/auth/profile/${user._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.data);
        toast.success("Profile updated successfully");
        router.push("/profile-settings");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/change-password/${user._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setActiveTab("profile");
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <section className="min-h-screen  py-6">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white/5 backdrop-blur-md border border-gray-700/50 rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-gray-700/50">
              <button
                onClick={() => router.push("/profile-settings")}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <FaArrowLeft className="text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">Edit Profile</h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700/50">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "text-pink-400 border-b-2 border-pink-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FaUser className="inline mr-2" />
                Profile Info
              </button>
              {canChangePassword && (
                <button
                  onClick={() => setActiveTab("password")}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === "password"
                      ? "text-pink-400 border-b-2 border-pink-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaLock className="inline mr-2" />
                  Change Password
                </button>
              )}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                {/* Profile Image */}
                <div className="flex flex-col items-center py-8 border-b border-gray-700/50">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1">
                      <div className="w-full h-full rounded-full bg-[#0B1730] flex items-center justify-center overflow-hidden">
                        {photo ? (
                          photo.startsWith("http") ? (
                            <Image
                              src={photo}
                              alt="Profile"
                              width={112}
                              height={112}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={photo}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <FaUser className="text-4xl text-gray-400" />
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
                    >
                      <FaCamera size={16} className="text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-3">
                    Tap to change photo
                  </p>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Phone Number
                      {user?.authProvider === "phone" && (
                        <span className="text-xs text-green-400 ml-2">
                          (Primary - Cannot change)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={
                        canEditPhone
                          ? formData.phone
                          : formData.phone
                            ? `+91 ${formData.phone}`
                            : "Not provided"
                      }
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      disabled={!canEditPhone}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors ${
                        !canEditPhone
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-white"
                      }`}
                    />
                    {!canEditPhone && (
                      <p className="text-xs text-gray-500 mt-1">
                        Phone number is your login method and cannot be changed
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Email Address
                      {user?.authProvider === "google" && (
                        <span className="text-xs text-red-400 ml-2">
                          (Google - Cannot change)
                        </span>
                      )}
                      {user?.authProvider === "local" && (
                        <span className="text-xs text-blue-400 ml-2">
                          (Primary - Cannot change)
                        </span>
                      )}
                      {user?.authProvider === "phone" && (
                        <span className="text-xs text-green-400 ml-2">
                          (Optional)
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={
                        canEditEmail
                          ? "Add your email address"
                          : "Enter your email"
                      }
                      disabled={!canEditEmail}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-gray-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors ${
                        !canEditEmail
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-white"
                      }`}
                    />
                    {user?.authProvider === "google" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email is linked to your Google account
                      </p>
                    )}
                    {user?.authProvider === "local" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email is your login method and cannot be changed
                      </p>
                    )}
                    {user?.authProvider === "phone" && !formData.email && (
                      <p className="text-xs text-green-400/70 mt-1">
                        Add an email to receive booking confirmations
                      </p>
                    )}
                  </div>

                  {/* Auth Provider Info */}
                  <div className="bg-white/5 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-sm text-gray-400">Account Type</p>
                    <p className="text-white font-medium capitalize flex items-center gap-2 mt-1">
                      {user?.authProvider === "google" && "🔴 Google Account"}
                      {user?.authProvider === "phone" && "📱 Phone Login"}
                      {user?.authProvider === "local" && "📧 Email & Password"}
                      {!user?.authProvider && "📧 Email & Password"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {user?.authProvider === "google" &&
                        "✓ Name ✓ Phone ✓ Profile Image | ✗ Email (Google linked)"}
                      {user?.authProvider === "phone" &&
                        "✓ Name ✓ Email ✓ Profile Image | ✗ Phone (Login method)"}
                      {(user?.authProvider === "local" ||
                        !user?.authProvider) &&
                        "✓ Name ✓ Phone ✓ Profile Image ✓ Password | ✗ Email (Login method)"}
                    </p>
                  </div>

                  {/* Submit */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Password Tab */}
            {activeTab === "password" && canChangePassword && (
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-blue-400 text-sm">
                    🔐 Password change is only available for email/password
                    accounts
                  </p>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-gray-700 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordData.confirmPassword &&
                    passwordData.newPassword !==
                      passwordData.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    disabled={
                      loading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                  >
                    {loading ? "Changing Password..." : "Change Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
};

export default ProfileEditPage;
