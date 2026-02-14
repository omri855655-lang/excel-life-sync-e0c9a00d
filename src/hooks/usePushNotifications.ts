import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BDA-BXp_JflLBc2rOgpr5AYyPtiqLKvzeJsoRoahBYItep2e_pU5la9Y38fcPF7M2MMuMDEQom2VjHbcAKZFU8I";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    if (supported && user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (registration) {
        const subscription = await (registration as any).pushManager?.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (e) {
      console.error("Error checking push subscription:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("יש לאשר התראות בדפדפן");
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("התראות push הופעלו בהצלחה!");
      return true;
    } catch (e: any) {
      console.error("Error subscribing to push:", e);
      toast.error("שגיאה בהפעלת התראות");
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw-push.js");
      if (registration) {
        const subscription = await (registration as any).pushManager?.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint)
            .eq("user_id", user.id);
        }
      }
      setIsSubscribed(false);
      toast.success("התראות push כובו");
    } catch (e: any) {
      console.error("Error unsubscribing:", e);
      toast.error("שגיאה בכיבוי התראות");
    }
  }, [user]);

  return { isSubscribed, isSupported, loading, subscribe, unsubscribe };
}
