import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  type AcademicGroup,
  subscribeToPosts,
  createPost,
  type GroupPost,
  subscribeToUnits,
  type AcademicUnit,
} from "../../lib/groups";
import {
  subscribeToResources,
  uploadResource,
  deleteResource,
  type CourseResource,
} from "../../lib/resources";
import {
  ArrowLeft,
  Users,
  User,
  Shield,
  MessageSquare,
  Send,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  Trash2,
  Paperclip,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { formatDistanceToNow } from "date-fns";
import { AddUnitDialog } from "../../components/groups/GroupDialogs";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<AcademicGroup | null>(null);

  // Tabs: 'feed' | 'units' | 'resources'
  const [activeTab, setActiveTab] = useState<"feed" | "units" | "resources">(
    "feed"
  );

  // Data
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);

  // Loading states
  const [postsLoading, setPostsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Resource Form State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUnitId, setResourceUnitId] = useState("");

  // Post Form State
  const [newPost, setNewPost] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [isAssessment, setIsAssessment] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Dialogs
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);

  // Subscribe to Units
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToUnits(groupId, (data) => {
      setUnits(data);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Subscribe to Resources
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToResources(groupId, (data) => {
      setResources(data);
    });
    return () => unsubscribe();
  }, [groupId]);

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !uploadFile) return;

    try {
      setIsUploading(true);
      const unit = units.find((u) => u.id === resourceUnitId);

      await uploadResource(groupId, uploadFile, {
        unitId: resourceUnitId,
        unitName: unit?.name || "General",
        title: resourceTitle || uploadFile.name,
        description: "",
        uploadedBy: user.uid,
      });

      // Reset Form
      setUploadFile(null);
      setResourceTitle("");
      setResourceUnitId("");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Make sure the file is < 10MB.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (res: CourseResource) => {
    if (!confirm("Delete this file permanently?")) return;
    if (!groupId) return;
    await deleteResource(groupId, res.id, (res as any).storagePath); // Need to expose storagePath in type or just cast
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId || !newPost.trim()) return;

    try {
      setIsPosting(true);

      const unit = units.find((u) => u.id === selectedUnitId);

      await createPost(
        groupId,
        user.uid,
        user.displayName || "Student",
        newPost,
        isRep ? "announcement" : "general",
        {
          unitId: selectedUnitId || undefined,
          unitName: unit?.name,
          isAssessment: isAssessment,
          eventDate: examDate ? new Date(examDate) : undefined,
        }
      );
      setNewPost("");
      setSelectedUnitId("");
      setIsAssessment(false);
      setExamDate("");
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
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/groups")}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Groups
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
              {isRep && (
                <span className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <Shield className="h-3 w-3 mr-1" />
                  You are Rep
                </span>
              )}
            </div>
            <p className="text-lg text-muted-foreground mt-1">
              {group.code} • {group.memberCount} Students
            </p>
          </div>

          <div className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg border border-border">
            <div className="flex flex-col text-right">
              <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Join Code
              </span>
              <span className="font-mono text-xl font-bold text-primary select-all">
                {group.joinCode}
              </span>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <div className="flex flex-col">
              <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                Members
              </span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {group.memberCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("feed")}
            className={`${
              activeTab === "feed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-input"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <MessageSquare className="h-4 w-4" />
            Discussion Feed
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`${
              activeTab === "units"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-input"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <BookOpen className="h-4 w-4" />
            Units & Schedule
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`${
              activeTab === "resources"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-input"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="h-4 w-4" />
            Resources
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "feed" && (
            <>
              {/* Post Creator */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <form onSubmit={handlePost} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <textarea
                        placeholder={
                          isRep
                            ? "Post an announcement..."
                            : "Ask a question..."
                        }
                        className="w-full px-4 py-2 bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none h-20 text-sm text-foreground placeholder:text-muted-foreground"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      {/* Unit Selector */}
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="h-8 text-xs border border-input rounded bg-card text-foreground px-2 focus:ring-2 focus:ring-primary"
                      >
                        <option value="">General (All Cohort)</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code} - {u.name}
                          </option>
                        ))}
                      </select>

                      {/* Assessment Toggle (Rep Only) */}
                      {isRep && selectedUnitId && (
                        <div className="flex items-center gap-2 pl-2 border-l border-border">
                          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAssessment}
                              onChange={(e) =>
                                setIsAssessment(e.target.checked)
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            It's a CAT/Exam?
                          </label>
                          {isAssessment && (
                            <input
                              type="date"
                              value={examDate}
                              onChange={(e) => setExamDate(e.target.value)}
                              className="h-7 text-xs border border-input rounded px-1 bg-card text-foreground"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={isPosting || !newPost.trim()}
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                      <Send className="h-3 w-3 ml-2" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading posts...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border shadow-sm p-12 flex flex-col items-center justify-center text-muted-foreground text-center">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p>No posts yet. Start the conversation!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-card rounded-lg border border-border shadow-sm p-4 transition-all hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {post.authorName}
                          </span>

                          {/* Unit Tag */}
                          {post.unitName && (
                            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-1.5 py-0.5 rounded flex items-center">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {post.unitName}
                            </span>
                          )}

                          {/* Assessment Tag */}
                          {post.isAssessment && (
                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 px-1.5 py-0.5 rounded flex items-center uppercase">
                              <Calendar className="h-3 w-3 mr-1" />
                              EXAM / CAT
                            </span>
                          )}

                          {post.type === "announcement" &&
                            !post.isAssessment && (
                              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-1.5 py-0.5 rounded">
                                Announcement
                              </span>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {post.createdAt?.toMillis
                            ? formatDistanceToNow(post.createdAt.toMillis(), {
                                addSuffix: true,
                              })
                            : "Just now"}
                        </span>
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                        {post.content}
                      </p>
                      {post.eventDate && (
                        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded text-xs text-orange-800 dark:text-orange-300 flex items-center">
                          <Clock className="h-3 w-3 mr-2" />
                          <strong>Due Date:</strong>{" "}
                          {new Date(
                            post.eventDate.seconds * 1000
                          ).toDateString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "resources" && (
            <div className="space-y-6">
              {/* Upload Form - Rep Only */}
              {isRep && (
                <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <Paperclip className="h-4 w-4" />
                    Upload Learning Material
                  </h3>
                  <form onSubmit={handleUpload} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="File Title (e.g., Week 1 Slides)"
                        className="text-sm border border-input bg-background rounded px-3 py-2 text-foreground placeholder:text-muted-foreground"
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        required
                      />
                      <select
                        value={resourceUnitId}
                        onChange={(e) => setResourceUnitId(e.target.value)}
                        className="text-sm border border-input rounded px-3 py-2 bg-background text-foreground"
                        required
                      >
                        <option value="">Select Unit</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.code} - {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        onChange={(e) =>
                          setUploadFile(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                        required
                      />
                      <div className="flex-1"></div>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Resources List */}
              <div className="space-y-3">
                {resources.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">
                      No resources available
                    </h3>
                  </div>
                ) : (
                  resources.map((res) => (
                    <div
                      key={res.id}
                      className="bg-card p-3 rounded-lg border border-border shadow-sm flex items-start gap-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4
                            className="font-medium text-sm text-foreground truncate pr-2"
                            title={res.title}
                          >
                            {res.title}
                          </h4>
                          {isRep && (
                            <button
                              onClick={() => handleDeleteResource(res)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            {res.unitName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •{" "}
                            {new Date(
                              res.createdAt?.seconds * 1000 || Date.now()
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "units" && (
            <div className="space-y-4">
              {isRep && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsAddUnitOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                  >
                    Add New Unit
                  </button>
                </div>
              )}

              {units.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    No units added yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reps can add units to build the schedule.
                  </p>
                </div>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-card rounded-lg border border-border shadow-sm p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground">{unit.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {unit.code} • {unit.lecturerName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Schedule
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {unit.schedule.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm border border-border"
                          >
                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded bg-card border border-border shadow-sm font-bold text-primary text-xs">
                              {slot.day.substring(0, 3)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {slot.startTime} - {slot.endTime}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {slot.location || "No location"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Class Rep
            </h3>
            <div className="text-sm text-muted-foreground">
              {isRep
                ? "You are managing this class."
                : "Contact your Rep for info."}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddUnitDialog
        open={isAddUnitOpen}
        onOpenChange={setIsAddUnitOpen}
        groupId={groupId || ""}
      />
    </div>
  );
}
