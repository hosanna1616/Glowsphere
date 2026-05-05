import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, MessageCircle, Heart } from "lucide-react";
import PostsApi from "../../api/postsApi";
import { resolveMediaUrl } from "../../utils/media";

const SavedFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await PostsApi.getSavedPosts();
      setPosts(response.posts || []);
    } catch (error) {
      console.error("Failed to load saved posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handleUnsave = async (postId) => {
    try {
      await PostsApi.savePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      console.error("Failed to unsave post:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-black border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-amber-300 hover:text-amber-200 text-xl"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-amber-300">Saved Collection</h1>
        <div className="w-6" />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-amber-300">
          Loading saved posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 text-center px-4">
          <div className="text-6xl mb-4">🔖</div>
          <div className="text-amber-300 text-xl font-semibold mb-2">
            No saved posts yet
          </div>
          <div className="text-amber-400">
            Save posts from feed and they will appear here.
          </div>
        </div>
      ) : (
        <div className="pb-20">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-black border-b border-stone-800 mb-1"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                      {post.authorAvatar ? (
                        <img
                          src={resolveMediaUrl(post.authorAvatar)}
                          alt={post.authorName || post.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-amber-300 text-sm font-bold">
                          {(post.authorName || post.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {post.authorName || post.username}
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(post._id)}
                  aria-label="Unsave post"
                >
                  <Bookmark className="w-6 h-6 fill-amber-400 text-amber-400" />
                </button>
              </div>

              {post.mediaUrl && (
                <div className="relative w-full aspect-square bg-stone-900">
                  {post.mediaType === "video" ? (
                    <video
                      src={resolveMediaUrl(post.mediaUrl)}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(post.mediaUrl)}
                      alt="Saved post"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}

              <div className="px-4 py-3">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center gap-1 text-white">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                  </div>
                </div>
                <p className="text-white text-sm break-words">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedFeed;
