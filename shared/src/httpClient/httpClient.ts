import { ConfigurationError } from "./errors/ConfigurationError.error";
import { HttpClientError } from "./errors/HttpClientError.error";
import { HttpServerError } from "./errors/HttpServerError.error";

export interface HttpClient {
  get: (config: HttpClientGetConfig) => Promise<HttpResponse>;
  post: (config: HttpClientPostConfig) => Promise<HttpResponse>;
  //get$: (config: HttpClientGetConfig) => Observable<HttpResponse>;
  //post$: (config: HttpClientPostConfig) => Observable<HttpResponse>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
}

export const getTargetFromPredicate = (
  predicate: (params: any) => AbsoluteUrl,
  targetsUrls: Record<string, (params: any) => AbsoluteUrl>,
): string | never => {
  const target: string | undefined = Object.keys(targetsUrls).find(
    (targetsUrlKey) => targetsUrls[targetsUrlKey] === predicate,
  );
  if (!target)
    throw new ConfigurationError(
      "Invalid configuration: This target predicate does not match any registered target",
    );
  return target;
};

export const isHttpError = (
  error: any,
): error is HttpClientError | HttpServerError =>
  error instanceof HttpClientError || error instanceof HttpServerError;

type Http = "http://" | "https://";
export type AbsoluteUrl = `${Http}${string}`;

export const isHttpClientError = (status: number): boolean =>
  status >= 400 && status < 500;

export const isHttpServerError = (status: number): boolean =>
  status >= 500 && status < 600;

export type TargetUrlsMapper<TargetUrls extends string> = Record<
  TargetUrls,
  (params: any) => AbsoluteUrl
>;

export type ErrorMapper<TargetUrls extends string> = Partial<
  Record<TargetUrls, Partial<Record<string, (error: Error) => Error>>>
>;

export interface HttpResponse<T = any, _D = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
  request?: any;
}

export type HttpClientPostConfig = {
  target: (params: any) => AbsoluteUrl;
  targetParams?: any;
  data?: string | undefined;
  adapterConfig?: any;
};

export type HttpClientGetConfig = {
  target: (params: any) => AbsoluteUrl;
  targetParams?: any;
  adapterConfig?: any;
};
