export type UploadedMedia = {
  id: string;
  url: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  kind: "image" | "video" | "audio" | "document";
};

export async function uploadVeloraMedia(file: File, scope: "profile" | "post" | "story" | "message", altText = ""): Promise<UploadedMedia> {
  const previewToken = sessionStorage.getItem("manus-cookie");
  const response = await fetch("/api/media/upload", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type,
      "x-velora-media-scope": scope,
      "x-velora-file-name": encodeURIComponent(file.name),
      "x-velora-alt-text": encodeURIComponent(altText),
      ...(previewToken ? { Authorization: `Bearer ${previewToken}` } : {}),
    },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The upload could not be completed.");
  return result as UploadedMedia;
}
