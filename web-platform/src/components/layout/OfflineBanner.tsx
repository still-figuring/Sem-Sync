import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { cn } from "../../lib/utils";

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Don't show anything if online and never went offline
  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white animate-in slide-in-from-top"
          : "bg-amber-500 text-white"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online! Syncing your latest data...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Showing cached data.</span>
        </>
      )}
    </div>
  );
}
