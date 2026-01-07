import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  type AcademicGroup,
  subscribeToPosts,
  createPost,
  type GroupPost,
} from "../../lib/groups";
import {
  ArrowLeft,
  Users,
  User,
  Shield,
  MessageSquare,
  Send,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow } from "date-fns";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<AcademicGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to posts
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToPosts(groupId, (data) => {
      setPosts(data);
      setPostsLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    async function fetchGroup() {
      if (!groupId) return;
      try {
        const docRef = doc(db, "groups", groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGroup({ id: docSnap.id, ...docSnap.data() } as AcademicGroup);
        } else {
          console.error("No such group!");
        }
      } catch (e) {
        console.error("Error fetching group:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [groupId]);

  if (loading) return <div className="p-8">Loading group details...</div>;
  if (!group) return <div className="p-8">Group not found.</div>;

  const isRep = user?.uid === group.repId;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !newPost.trim()) return;

    try {
      setIsPosting(true);
      await createPost(
        groupId,
        user.uid,
        user.displayName || "Student",
        newPost,
        isRep ? "announcement" : "general"
      );
      setNewPost("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/groups")}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Groups
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              {isRep && (
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Shield className="h-3 w-3 mr-1" />
                  You are Rep
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 mt-1">
              {group.code} • {group.lecturerName}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border">
            <div className="flex flex-col text-right">
              <span className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                Join Code
              </span>
              <span className="font-mono text-xl font-bold text-indigo-600 select-all">
                {group.joinCode}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <span className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                Members
              </span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {group.memberCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Creator */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <form onSubmit={handlePost} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={
                    isRep
                      ? "Post an announcement..."
                      : "Ask a question or share something..."
                  }
                  className="w-full px-4 py-2 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
              </div>
              <button
                disabled={isPosting || !newPost.trim()}
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {postsLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg border shadow-sm p-12 flex flex-col items-center justify-center text-gray-400 text-center">
                <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                <p>No posts yet. Start the conversation!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border shadow-sm p-4 transition-all hover:bg-gray-50/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {post.authorName}
                      </span>
                      {post.type === "announcement" && (
                        <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                          Announcement
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {post.createdAt?.toMillis
                        ? formatDistanceToNow(post.createdAt.toMillis(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Class Rep
            </h3>
            <div className="text-sm text-gray-600">
              {isRep
                ? "You are managing this class."
                : "Contact your Rep for info."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
