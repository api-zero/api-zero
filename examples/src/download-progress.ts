import { api } from "./create-client";

const report = await api.get<Blob>("/report.pdf", {
  responseType: "blob",
  onDownloadProgress: (event) => {
    console.log(event.loaded, event.total);
  },
});
