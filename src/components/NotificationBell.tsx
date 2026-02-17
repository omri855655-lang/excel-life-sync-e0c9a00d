import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  notification_type: string;
  channel: string;
  created_at: string;
  event_id: string | null;
  task_id: string | null;
}

const typeLabels: Record<string, string> = {
  event_5min: "⏰ תזכורת 5 דק׳",
  event_15min: "⏰ תזכורת 15 דק׳",
  event_1hour: "⏰ תזכורת שעה",
  event_completion: "🏁 בדיקת סיום",
  morning_summary: "☀️ סיכום בוקר",
  deadline_reminder: "📆 תזכורת דדליין",
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Use edge function or RPC since sent_notifications has service-role-only RLS
      // We'll query via the tasks edge function approach - actually let's use supabase function
      const { data, error } = await supabase.functions.invoke("get-notifications", {
        body: {},
      });

      if (!error && data?.notifications) {
        setNotifications(data.notifications);
      }
    };

    fetchNotifications();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [user]);

  const unseenCount = Math.max(0, notifications.length - lastSeenCount);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLastSeenCount(notifications.length);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" dir="rtl" align="end">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">התראות שנשלחו</h3>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              אין התראות עדיין
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {typeLabels[n.notification_type] || n.notification_type}
                    </span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      n.channel === "email" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                      {n.channel === "email" ? "📧 מייל" : "🔔 Push"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString("he-IL")} {new Date(n.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
