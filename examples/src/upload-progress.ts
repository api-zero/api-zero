import { api } from "./create-client";

declare const file: Blob;

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
