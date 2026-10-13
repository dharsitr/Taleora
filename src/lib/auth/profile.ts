import { createClient } from "@/lib/supabase/client";
import { validateImageUpload, sanitizeText } from "@/lib/security/validation";

/**
 * Upload a user profile avatar image to Supabase storage.
 * Uploads to the 'book-covers' bucket under the 'avatars/{userId}/' path
 * which has authenticated upload policies already enabled.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  if (!userId || typeof userId !== "string") {
    throw new Error("Authentication required to upload an avatar.");
  }

  const supabase = createClient();

  // 1. Strict image format and size validation (max 5MB, JPEG/PNG/WebP/GIF)
  const { safeExtension, mimeType } = validateImageUpload(file);

  // 2. Collision-resistant path under user's folder
  const randomSuffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).substring(2, 10);

  const filePath = `${userId}/avatar-${Date.now()}-${randomSuffix}.${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("book-covers")
    .upload(filePath, file, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw new Error(uploadError.message || "Failed to upload avatar image.");
  }

  const { data } = supabase.storage
    .from("book-covers")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export interface UpdateProfileInput {
  fullName: string;
  avatarUrl?: string | null;
}

/**
 * Update user display name and profile picture.
 * Username is permanently preserved and CANNOT be updated.
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User is not authenticated." };
  }

  const sanitizedName = sanitizeText(input.fullName, 80);
  if (!sanitizedName || sanitizedName.length < 2) {
    return { success: false, error: "Name must be at least 2 characters long." };
  }

  const supabase = createClient();

  try {
    const updates: {
      full_name: string;
      avatar_url?: string | null;
      updated_at: string;
    } = {
      full_name: sanitizedName,
      updated_at: new Date().toISOString(),
    };

    if (input.avatarUrl !== undefined) {
      updates.avatar_url = input.avatarUrl;
    }

    // 1. Update public.profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profiles table:", profileError);
      return { success: false, error: profileError.message };
    }

    // 2. Update Supabase Auth user metadata
    const userMetadataUpdates: Record<string, unknown> = {
      full_name: sanitizedName,
    };
    if (input.avatarUrl !== undefined) {
      userMetadataUpdates.avatar_url = input.avatarUrl;
    }

    await supabase.auth.updateUser({
      data: userMetadataUpdates,
    });

    // 3. Keep author row in sync if user is an author
    const authorUpdates: {
      name: string;
      updated_at: string;
      avatar_url?: string | null;
    } = {
      name: sanitizedName,
      updated_at: new Date().toISOString(),
    };
    if (input.avatarUrl !== undefined) {
      authorUpdates.avatar_url = input.avatarUrl;
    }

    await supabase
      .from("authors")
      .update(authorUpdates)
      .eq("user_id", userId);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    console.error("Error in updateUserProfile:", err);
    return { success: false, error: msg };
  }
}
