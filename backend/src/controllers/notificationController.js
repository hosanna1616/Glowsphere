const Notification = require("../models/Notification");
const { getIo } = require("../socket");

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
      // Check if user owns this notification
      if (notification.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to update this notification" });
      }

      notification.isRead = true;
      const updatedNotification = await notification.save();
      res.json(updatedNotification);
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
      // Check if user owns this notification
      if (notification.userId.toString() !== req.user._id.toString()) {
        return res
          .status(401)
          .json({ message: "Not authorized to delete this notification" });
      }

      await notification.remove();
      res.json({ message: "Notification removed" });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notification (internal use)
const createNotification = async (
  userId,
  title,
  message,
  type = "info",
  relatedEntityId = null,
  relatedEntityType = null,
  options = {}
) => {
  try {
    const { actionPath = "", actorUsername = "" } = options || {};
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedEntityId,
      relatedEntityType,
      actionPath,
      actorUsername,
    });

    await notification.save();
    const io = getIo();
    if (io) {
      io.to(`user:${String(userId)}`).emit("notification:new", notification);
    }
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
