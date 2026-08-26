import { createClient } from "@api-zero/core";

const api = createClient({ baseURL: "https://api.example.com" });

export async function uploadWithProgress(file: Blob) {
  //#region upload
  const form = new FormData();
  form.append("file", file);
  form.append("title", "My image");

  await api.post("/upload", form, {
    onUploadProgress: (event) => {
      if (!event.lengthComputable) return;
      const percent = (event.loaded / event.total) * 100;
      console.log(`${percent.toFixed(1)}%`);
    },
  });
  //#endregion
}

export async function downloadWithProgress() {
  //#region download
  const blob = await api.get<Blob>("/report.pdf", {
    responseType: "blob",
    onDownloadProgress: (event) => {
      console.log(event.loaded, event.total);
    },
  });
  return blob;
  //#endregion
}
