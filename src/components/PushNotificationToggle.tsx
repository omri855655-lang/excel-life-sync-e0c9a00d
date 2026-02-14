import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PushNotificationToggle = () => {
  const { isSubscribed, isSupported, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={isSubscribed ? "text-primary" : "text-muted-foreground"}
        >
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isSubscribed ? "כבה התראות push" : "הפעל התראות push"}
      </TooltipContent>
    </Tooltip>
  );
};

export default PushNotificationToggle;
