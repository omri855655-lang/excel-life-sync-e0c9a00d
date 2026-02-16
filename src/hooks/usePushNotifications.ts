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

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  // Check for existing registration first
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;

  // Register our push SW as fallback
  const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  await reg.update();
  return reg;
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
      const registration = await getOrRegisterSW();
      const subscription = await (registration as any).pushManager?.getSubscription();
      setIsSubscribed(!!subscription);
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

      let registration: ServiceWorkerRegistration;
      try {
        registration = await getOrRegisterSW();
      } catch (swErr: any) {
        console.error("SW registration error:", swErr);
        toast.error("שגיאה ברישום Service Worker - נסה לפרסם ולבדוק מהאפליקציה המותקנת");
        return false;
      }

      // Wait for SW to be active
      if (registration.installing || registration.waiting) {
        await new Promise<void>((resolve) => {
          const sw = registration.installing || registration.waiting;
          if (!sw) { resolve(); return; }
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve();
          });
          // Timeout after 5s
          setTimeout(resolve, 5000);
        });
      }

      const pm = (registration as any).pushManager;
      if (!pm) {
        toast.error("הדפדפן לא תומך בהתראות Push");
        return false;
      }

      let subscription;
      try {
        subscription = await pm.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      } catch (pushErr: any) {
        console.error("PushManager.subscribe error:", pushErr);
        if (pushErr.message?.includes("push service")) {
          toast.error("שגיאת push service - נסה מהאפליקציה המותקנת או מ-Chrome בלבד");
        } else {
          toast.error(`שגיאה בהרשמה: ${pushErr.message}`);
        }
        return false;
      }

      const subJson = subscription.toJSON();

      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Missing subscription keys");
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("התראות push הופעלו! תקבל תזכורות 5 דקות לפני כל אירוע");
      return true;
    } catch (e: any) {
      console.error("Push subscription error:", e);
      toast.error(`שגיאה בהפעלת התראות: ${e.message || "נסה שוב"}`);
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await getOrRegisterSW();
      const subscription = await (registration as any).pushManager?.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint)
          .eq("user_id", user.id);
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
