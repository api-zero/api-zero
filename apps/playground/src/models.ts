export interface HttpBinResponse {
  args: Record<string, string>;
  headers: Record<string, string>;
  origin: string;
  url: string;
}

export interface HttpBinGetResponse extends HttpBinResponse {
  args: Record<string, string>;
}

export interface HttpBinPostResponse extends HttpBinResponse {
  data: string;
  files: Record<string, string>;
  form: Record<string, string>;
  json: any;
}

export interface HttpBinPutResponse extends HttpBinPostResponse {}
export interface HttpBinPatchResponse extends HttpBinPostResponse {}
export interface HttpBinDeleteResponse extends HttpBinResponse {
  data: string;
  json: null;
}

export interface PostBody {
  message: string;
  timestamp: number;
}

export interface PutBody {
  update: string;
  id: number;
}

export interface PatchBody {
  update: string;
}

export interface GetParams {
  id: number;
  name: string;
}

export interface SlideshowResponse {
  slideshow: {
    author: string;
    date: string;
    slides: Array<{
      title: string;
      type: string;
      items?: string[];
    }>;
    title: string;
  };
}
