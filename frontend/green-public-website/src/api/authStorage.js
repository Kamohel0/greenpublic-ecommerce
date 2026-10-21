export function clearAuthTokens() {
    try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
    } catch {
        // ignore
    }
}