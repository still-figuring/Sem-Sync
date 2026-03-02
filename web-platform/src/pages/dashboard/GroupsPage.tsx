import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Hash, Copy, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { subscribeToUserGroups, type AcademicGroup } from "../../lib/groups";
import {
  CreateGroupDialog,
  JoinGroupDialog,
} from "../../components/groups/GroupDialogs";

export default function GroupsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserGroups(user.uid, (data) => {
      setGroups(data);
    });
    return () => unsubscribe();
  }, [user]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Academic Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with your class and lecturer.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-card border border-border text-foreground hover:bg-muted h-10 px-4 py-2"
          >
            <Hash className="mr-2 h-4 w-4" />
            Join Course
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              No groups joined
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Join a class with a code or create one as a Rep.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="group relative rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold leading-none tracking-tight text-lg text-foreground">
                      {group.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.code}
                    </p>
                  </div>

                  {/* Badge for Creator */}
                  {group.repId === user?.uid && (
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                      Rep
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount} Members</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Lecturer:</span>{" "}
                  {group.lecturerName}
                </div>

                <div className="pt-2 border-t mt-auto">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                    <span className="text-gray-500">Join Code:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(group.joinCode);
                      }}
                      className="flex items-center gap-1 font-mono font-bold text-indigo-600 hover:underline"
                    >
                      {group.joinCode}
                      {copiedId === group.joinCode ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateGroupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <JoinGroupDialog open={isJoinOpen} onOpenChange={setIsJoinOpen} />
    </div>
  );
}
