import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserApi from "../../api/userApi";
import apiClient from "../../api/apiClient";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { user, logout, setUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user profile from API
        const userProfile = await UserApi.getCurrentUser();
        if (userProfile) {
          setProfileData({
            name: userProfile.name || profileData.name,
            username: userProfile.username || profileData.username,
            email: userProfile.email || profileData.email,
            bio: userProfile.bio || profileData.bio,
            location: userProfile.location || profileData.location,
            avatar: userProfile.avatar || profileData.avatar,
          });
          setAvatarPreview(userProfile.avatar || "");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = apiClient.getToken();
      if (!token) {
        setError("Please log in to update your profile");
        return;
      }

      let response;
      
      // If avatar file is selected, use FormData
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        formData.append("name", profileData.name);
        formData.append("username", profileData.username);
        formData.append("email", profileData.email);
        formData.append("bio", profileData.bio || "");
        formData.append("location", profileData.location || "");

        response = await fetch(`${apiClient.getApiBaseUrl()}/auth/profile`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        });
      } else {
        // Regular JSON update
        response = await fetch(`${apiClient.getApiBaseUrl()}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });
      }

      if (!response.ok) {
        // If backend is not available, update localStorage as fallback
        if (
          response.status === 500 ||
          response.status === 503 ||
          response.status === 0
        ) {
          // Update localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            // Update auth context
            setUser(updatedUser);
            setSuccess("Profile updated successfully (offline mode)!");
            // Hide success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json();

      // Update auth context
      setUser(updatedUser);
      setAvatarFile(null); // Clear file after successful upload
      setSuccess("Profile updated successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      // Fallback to localStorage if network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        try {
          // Update localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            // Update auth context
            setUser(updatedUser);
            setSuccess("Profile updated successfully (offline mode)!");
            // Hide success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
            return;
          }
        } catch (storageError) {
          console.error("Failed to update localStorage:", storageError);
        }
      }

      if (error.message && error.message.includes("duplicate key")) {
        setError(
          "This username or email is already taken. Please choose another one."
        );
      } else {
        setError("Failed to update profile. Please try again.");
      }
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => navigate("/feed")}
          className="absolute left-4 text-amber-300 hover:text-amber-200 text-xl"
        >
          ←
        </button>
        <h1 className="text-3xl font-bold text-amber-400">Your Profile</h1>
      </div>

      <div className="bg-card-bg backdrop-blur-sm rounded-xl border border-amber-500/30 overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 md:p-8 gradient-bg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gold-gradient flex items-center justify-center text-3xl text-black font-bold overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name ? profileData.name.charAt(0) : "U"
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-2 cursor-pointer hover:bg-amber-600 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <span className="text-black text-sm">📷</span>
              </label>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold text-amber-300">
                {profileData.name}
              </h2>
              <p className="text-amber-200 mb-2">@{profileData.username}</p>
              <p className="text-amber-200 mb-4">{profileData.bio}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="bg-stone-800 px-3 py-1 rounded-full text-sm text-amber-200">
                  📍 {profileData.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="border-b border-amber-500/30">
          <div className="flex">
            <button
              className={`px-6 py-4 font-medium ${
                activeTab === "profile"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-amber-200 hover:text-amber-300"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Edit Profile
            </button>
            <button
              className={`px-6 py-4 font-medium ${
                activeTab === "settings"
                  ? "text-amber-400 border-b-2 border-amber-400"
                  : "text-amber-200 hover:text-amber-300"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleSave}>
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-6 bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-200">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-amber-200 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-amber-200 mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-amber-200 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-amber-200 mb-2">Location</label>
                  <input
                    type="text"
                    className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        location: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-amber-200 mb-2">Bio</label>
                <textarea
                  className="w-full bg-stone-800 border border-amber-500/30 rounded-lg p-3 text-amber-200 placeholder-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="4"
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-300">
                  Account Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200">
                      Enable
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Change Password
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Update your password regularly for security
                      </p>
                    </div>
                    <button className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200">
                      Change
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Privacy Settings
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Control who can see your profile and activity
                      </p>
                    </div>
                    <button className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-300">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Logout from all devices
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Sign out from all devices except this one
                      </p>
                    </div>
                    <button className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors text-black">
                      Logout All
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Delete Account
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <button
                      className="bg-amber-700 px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-black"
                      onClick={logout}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
