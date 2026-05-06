"use server";

import { revalidatePath } from "next/cache";
import { dismissNotification } from "@/lib/notifications/derive";

export async function dismissNotificationAction(key: string): Promise<void> {
  if (!key) return;
  await dismissNotification(key);
  revalidatePath("/", "layout");
}
