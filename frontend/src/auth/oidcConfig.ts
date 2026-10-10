import type { AuthProviderProps } from "react-oidc-context";

export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin + "/",
  scope: "openid profile email",
  onSigninCallback: (user) => {
    const donus = (user?.state as { donus?: string } | undefined)?.donus ?? "/";
    window.history.replaceState({}, document.title, donus);
    window.dispatchEvent(new PopStateEvent("popstate"));
  },
};