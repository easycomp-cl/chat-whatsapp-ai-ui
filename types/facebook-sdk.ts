export type FacebookAuthResponse = {
  code?: string;
  accessToken?: string;
  userID?: string;
  expiresIn?: number;
};

export type FacebookLoginResponse = {
  authResponse?: FacebookAuthResponse | null;
  status?: string;
};

export type FacebookLoginOptions = {
  config_id: string;
  response_type: "code";
  override_default_response_type: boolean;
  extras: {
    setup: Record<string, unknown>;
    sessionInfoVersion?: string;
    featureType?: string;
  };
};

export type FacebookSDK = {
  init: (options: {
    appId: string;
    autoLogAppEvents?: boolean;
    xfbml?: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: FacebookLoginOptions
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

export {};
