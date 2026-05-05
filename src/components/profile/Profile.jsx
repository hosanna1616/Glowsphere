import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserApi from "../../api/userApi";
import apiClient from "../../api/apiClient";
import { resolveMediaUrl } from "../../utils/media";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [runningDangerAction, setRunningDangerAction] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [viewedUser, setViewedUser] = useState(null);

  const { user, logout, setUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
    fireSpirits: user?.fireSpirits || [],
    glowPoints: user?.glowPoints || 0,
    bloomGarden: user?.bloomGarden || [],
    emberCrownUntil: user?.emberCrownUntil || null,
  });
  const [settingsData, setSettingsData] = useState({
    profileVisibility: "public",
    discoverableByEmail: true,
    allowTagging: true,
    securityAlerts: true,
    marketingEmails: false,
    darkMode: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(
    resolveMediaUrl(user?.avatar || ""),
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const queryUsername = new URLSearchParams(location.search)
    .get("username")
    ?.trim()
    .toLowerCase();
  const isViewingOtherProfile =
    !!queryUsername && queryUsername !== String(user?.username || "").toLowerCase();

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (isViewingOtherProfile) {
          const results = await UserApi.searchUsers(queryUsername);
          const exact = (results || []).find(
            (u) => String(u.username || "").toLowerCase() === queryUsername
          );
          if (exact) {
            setViewedUser(exact);
            setAvatarPreview(resolveMediaUrl(exact.avatar || ""));
          } else {
            setViewedUser(null);
            setError("User profile not found or not visible to you");
          }
          return;
        }

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
            fireSpirits: userProfile.fireSpirits || profileData.fireSpirits,
            glowPoints: userProfile.glowPoints ?? profileData.glowPoints,
            bloomGarden: userProfile.bloomGarden || profileData.bloomGarden,
            emberCrownUntil:
              userProfile.emberCrownUntil ?? profileData.emberCrownUntil,
          });
          setSettingsData({
            profileVisibility: userProfile.settings?.profileVisibility || "public",
            discoverableByEmail:
              userProfile.settings?.discoverableByEmail ?? true,
            allowTagging: userProfile.settings?.allowTagging ?? true,
            securityAlerts: userProfile.settings?.securityAlerts ?? true,
            marketingEmails: userProfile.settings?.marketingEmails ?? false,
            darkMode: userProfile.settings?.darkMode ?? true,
          });
          setAvatarPreview(resolveMediaUrl(userProfile.avatar || ""));
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, [isViewingOtherProfile, queryUsername]);

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
    setSaving(true);

    try {
      const token = apiClient.getToken();
      if (!token) {
        setError("Please log in to update your profile");
        setSaving(false);
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
        formData.append("glowPoints", profileData.glowPoints || 0);
        formData.append("bloomGarden", JSON.stringify(profileData.bloomGarden || []));
        formData.append("fireSpirits", JSON.stringify(profileData.fireSpirits || []));
        formData.append(
          "emberCrownUntil",
          profileData.emberCrownUntil || "",
        );

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
        let backendMessage = "";
        try {
          const errorData = await response.json();
          backendMessage = errorData?.message || "";
        } catch (parseError) {
          backendMessage = "";
        }

        throw new Error(
          backendMessage || `HTTP error! status: ${response.status}`,
        );
      }

      const updatedUser = await response.json();
      const normalizedUser = {
        ...updatedUser,
        avatar: updatedUser.avatar || "",
      };

      // Update auth context
      setUser(normalizedUser);
      setProfileData((prev) => ({
        ...prev,
        name: normalizedUser.name || "",
        username: normalizedUser.username || "",
        email: normalizedUser.email || "",
        bio: normalizedUser.bio || "",
        location: normalizedUser.location || "",
        avatar: normalizedUser.avatar || "",
        fireSpirits: normalizedUser.fireSpirits || [],
        glowPoints: normalizedUser.glowPoints ?? 0,
        bloomGarden: normalizedUser.bloomGarden || [],
        emberCrownUntil: normalizedUser.emberCrownUntil || null,
      }));
      setAvatarPreview(resolveMediaUrl(normalizedUser.avatar || ""));
      setAvatarFile(null); // Clear file after successful upload
      setSuccess("Profile updated successfully!");

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      if (error.message && error.message.includes("duplicate key")) {
        setError(
          "This username or email is already taken. Please choose another one.",
        );
      } else if (error.message && error.message.includes("already taken")) {
        setError(error.message);
      } else {
        setError(
          error.message || "Failed to update profile. Please try again.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    setError("");
    setSuccess("");
    setSavingSettings(true);
    try {
      const response = await UserApi.updateSettings(settingsData);
      const latestSettings = response?.settings || settingsData;
      setSettingsData(latestSettings);
      if (response?.user) {
        setUser(response.user);
      }
      setSuccess("Settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (settingsError) {
      setError(settingsError.message || "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const updateSettingRealtime = async (key, value) => {
    const previous = settingsData[key];
    setSettingsData((prev) => ({ ...prev, [key]: value }));
    setSavingSettings(true);
    setError("");
    try {
      const response = await UserApi.updateSettings({ [key]: value });
      if (response?.settings) {
        setSettingsData((prev) => ({ ...prev, ...response.settings }));
      }
      if (response?.user) {
        setUser(response.user);
      }
    } catch (realtimeError) {
      setSettingsData((prev) => ({ ...prev, [key]: previous }));
      setError(realtimeError.message || "Failed to update setting.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await UserApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccess("Password changed. Please log in again.");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1200);
    } catch (passwordError) {
      setError(passwordError.message || "Failed to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setError("");
    setSuccess("");
    setRunningDangerAction(true);
    try {
      await UserApi.logoutAllSessions();
      setSuccess("Logged out from all devices. Please sign in again.");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1200);
    } catch (logoutError) {
      setError(logoutError.message || "Failed to log out all devices.");
    } finally {
      setRunningDangerAction(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = window.prompt(
      "To delete your account, enter your password:",
      "",
    );
    if (!password) {
      return;
    }
    const confirmed = window.confirm(
      "This will permanently deactivate your account. Continue?",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setRunningDangerAction(true);
    try {
      await UserApi.deleteAccount(password);
      setSuccess("Account deleted successfully.");
      setTimeout(() => {
        logout();
        navigate("/");
      }, 1000);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete account.");
    } finally {
      setRunningDangerAction(false);
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
        <h1 className="text-3xl font-bold text-amber-400">
          {isViewingOtherProfile ? "Profile" : "Your Profile"}
        </h1>
      </div>

      {isViewingOtherProfile && (
        <div className="bg-card-bg backdrop-blur-sm rounded-xl border border-amber-500/30 p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gold-gradient p-0.5 mb-4">
            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={viewedUser?.name || viewedUser?.username || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-amber-300 text-2xl font-bold">
                  {(viewedUser?.name || viewedUser?.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-amber-200">
            {viewedUser?.name || "Unknown User"}
          </h2>
          <p className="text-amber-300/80 mt-1">@{viewedUser?.username || queryUsername}</p>
        </div>
      )}

      {!isViewingOtherProfile && (

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
                ) : profileData.name ? (
                  profileData.name.charAt(0)
                ) : (
                  "U"
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
                <span className="bg-stone-800 px-3 py-1 rounded-full text-sm text-amber-200">
                  ✨ {profileData.glowPoints || 0} Glow Points
                </span>
                {profileData.emberCrownUntil &&
                  new Date(profileData.emberCrownUntil) > new Date() && (
                    <span className="bg-amber-500/20 px-3 py-1 rounded-full text-sm text-amber-100 border border-amber-300/40">
                      👑 Ember Crown Active
                    </span>
                  )}
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
                        username: e.target.value
                          .replace(/\s+/g, "")
                          .toLowerCase(),
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
                <h3 className="text-lg font-semibold text-amber-300 mb-3">
                  My Fire Spirits
                </h3>
                {profileData.fireSpirits?.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {profileData.fireSpirits.map((spirit) => (
                      <div
                        key={spirit.spiritName}
                        className="bg-stone-800 rounded-lg border border-amber-500/20 p-3 text-center"
                      >
                        <img
                          src={spirit.actorImage || spirit.iconImage}
                          alt={spirit.actorName || spirit.spiritName}
                          className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-amber-300/40"
                        />
                        <p className="text-amber-200 text-sm font-semibold">
                          {spirit.spiritName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-300/80 text-sm mb-4">
                    Choose your Fire Spirit in Campfire to see it here.
                  </p>
                )}
                <h3 className="text-lg font-semibold text-amber-300 mb-2">
                  Bloom Garden Rewards
                </h3>
                <p className="text-amber-200 text-sm mb-4">
                  {(profileData.bloomGarden || []).join(", ") || "No blooms yet"}
                </p>
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
                  disabled={saving}
                  className="bg-gold-gradient px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity text-black"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {success && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-green-200">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200">
                  {error}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-300">
                  Privacy & Preferences
                </h3>
                <div className="space-y-4">
                  {savingSettings && (
                    <div className="text-sm text-amber-300">Saving changes...</div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Profile Visibility</h4>
                      <p className="text-amber-300 text-sm">
                        Choose who can view your profile.
                      </p>
                    </div>
                    <select
                      value={settingsData.profileVisibility}
                      onChange={(e) =>
                        updateSettingRealtime("profileVisibility", e.target.value)
                      }
                      className="bg-stone-700 px-3 py-2 rounded-lg text-amber-200 border border-amber-500/20"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Discoverable by Email</h4>
                      <p className="text-amber-300 text-sm">
                        Let people find you using your email address.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingRealtime(
                          "discoverableByEmail",
                          !settingsData.discoverableByEmail,
                        )
                      }
                      className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200"
                    >
                      {settingsData.discoverableByEmail ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Allow Tagging</h4>
                      <p className="text-amber-300 text-sm">
                        Control whether others can tag you.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingRealtime(
                          "allowTagging",
                          !settingsData.allowTagging,
                        )
                      }
                      className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200"
                    >
                      {settingsData.allowTagging ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Security Alerts</h4>
                      <p className="text-amber-300 text-sm">
                        Receive alerts for important account events.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingRealtime(
                          "securityAlerts",
                          !settingsData.securityAlerts,
                        )
                      }
                      className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200"
                    >
                      {settingsData.securityAlerts ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Marketing Emails</h4>
                      <p className="text-amber-300 text-sm">
                        Receive updates, feature launches, and newsletters.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingRealtime(
                          "marketingEmails",
                          !settingsData.marketingEmails,
                        )
                      }
                      className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200"
                    >
                      {settingsData.marketingEmails ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">Dark Mode</h4>
                      <p className="text-amber-300 text-sm">
                        Keep dark mode enabled for this account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSettingRealtime("darkMode", !settingsData.darkMode)
                      }
                      className="bg-stone-700 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-amber-200"
                    >
                      {settingsData.darkMode ? "On" : "Off"}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSettingsSave}
                      disabled={savingSettings}
                      className="bg-gold-gradient px-5 py-2 rounded-full font-semibold text-black disabled:opacity-60"
                    >
                      Sync All
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-300">
                  Password & Security
                </h3>
                <form
                  onSubmit={handlePasswordUpdate}
                  className="space-y-4 p-4 bg-stone-800 rounded-lg"
                >
                  <div>
                    <label className="block text-amber-200 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-amber-200 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full bg-stone-900 border border-amber-500/30 rounded-lg p-3 text-amber-200"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-gold-gradient px-5 py-2 rounded-full font-semibold text-black disabled:opacity-60"
                    >
                      {updatingPassword ? "Updating..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-amber-300">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-stone-800 rounded-lg">
                    <div>
                      <h4 className="font-medium text-amber-200">
                        Logout from all sessions
                      </h4>
                      <p className="text-amber-300 text-sm">
                        Immediately revoke your active sessions on all devices.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutAllDevices}
                      disabled={runningDangerAction}
                      className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors text-black disabled:opacity-60"
                    >
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
                      type="button"
                      className="bg-amber-700 px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors text-black disabled:opacity-60"
                      onClick={handleDeleteAccount}
                      disabled={runningDangerAction}
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
      )}
    </div>
  );
};

export default Profile;
