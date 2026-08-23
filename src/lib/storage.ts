import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Zero-dependency base64 to Uint8Array decoder for cross-platform binary uploads.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/=+$/, '');
  const len = clean.length;
  const bufferLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = chars.indexOf(clean[i]);
    const enc2 = chars.indexOf(clean[i + 1]);
    const enc3 = chars.indexOf(clean[i + 2]);
    const enc4 = chars.indexOf(clean[i + 3]);

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes[p++] = chr1;
    if (enc3 !== -1 && p < bufferLength) bytes[p++] = chr2;
    if (enc4 !== -1 && p < bufferLength) bytes[p++] = chr3;
  }
  return bytes;
}

export interface PickedImageResult {
  localUri: string;
  base64?: string;
}

/**
 * Prompt user to select an image from their gallery and return the raw URI.
 */
export async function pickRawAvatarImage(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
      return null;
    }

    return pickerResult.assets[0].uri;
  } catch (err) {
    console.warn('Failed to pick raw avatar image:', err);
    return null;
  }
}

/**
 * Prompt user to select an image from their gallery, crop to 1:1 square,
 * and resize to 400x400 with high-quality compression.
 */
export async function pickAndCropAvatar(): Promise<PickedImageResult | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
      return null;
    }

    const rawUri = pickerResult.assets[0].uri;

    // Resize to 400x400 with 0.85 near-lossless JPEG compression
    const manipulated = await manipulateAsync(
      rawUri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.85, format: SaveFormat.JPEG, base64: true },
    );

    return {
      localUri: manipulated.uri,
      base64: manipulated.base64,
    };
  } catch (err) {
    console.warn('Failed to pick and crop avatar image:', err);
    return null;
  }
}

/**
 * Upload cropped avatar to Supabase Storage `avatars` bucket and return public URL.
 * Falls back to localUri if Supabase is offline or not configured.
 */
export async function uploadAvatarImage(userId: string, image: PickedImageResult): Promise<string> {
  if (!isSupabaseConfigured || !userId || !image.base64) {
    return image.localUri;
  }

  try {
    const fileBytes = base64ToUint8Array(image.base64);
    const fileName = `${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      // Fallback to local image URI so the app keeps working offline
      return image.localUri;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (data?.publicUrl) {
      // Append cache-busting timestamp parameter to force refresh
      return `${data.publicUrl}?t=${Date.now()}`;
    }

    return image.localUri;
  } catch (err) {
    console.warn('Exception during avatar upload to Supabase:', err);
    return image.localUri;
  }
}

/**
 * Remove avatar file from Supabase storage if present.
 */
export async function removeAvatarImage(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return true;

  try {
    const fileName = `${userId}.jpg`;
    await supabase.storage.from('avatars').remove([fileName]);
    return true;
  } catch (err) {
    console.warn('Failed to remove avatar from storage:', err);
    return false;
  }
}
