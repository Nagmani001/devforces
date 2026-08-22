import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { createUser } from "./user";
import { createAdminUser } from "./contest";

/**
 * Creates a user (or admin) in the database, signs in, and returns
 * the better-auth session cookie string for authenticated requests.
 */
export async function getAuthToken(user: { email: string; password: string; username: string }, isAdmin = false) {
    if (isAdmin) {
        await createAdminUser(user);
    } else {
        await createUser(user);
    }

    const signinRes = await axios.post(`${BACKEND_URL}/api/auth/sign-in/email`, {
        email: user.email,
        password: user.password
    });

    if (signinRes.status !== 200) {
        throw new Error(`Failed to sign in: ${JSON.stringify(signinRes.data)}`);
    }

    return toCookieHeader(signinRes.headers["set-cookie"]);
}

export function toCookieHeader(setCookie?: string[] | string): string {
    if (!setCookie) return "";
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

/**
 * Helper to make cookie-authenticated requests
 */
export function createAuthAxios(cookie: string) {
    return {
        get: async (url: string, config: any = {}) => {
            return axios.get(url, {
                ...config,
                headers: {
                    ...config.headers,
                    Cookie: cookie
                }
            });
        },
        post: async (url: string, data: any, config: any = {}) => {
            return axios.post(url, data, {
                ...config,
                headers: {
                    ...config.headers,
                    Cookie: cookie
                }
            });
        },
        put: async (url: string, data: any, config: any = {}) => {
            return axios.put(url, data, {
                ...config,
                headers: {
                    ...config.headers,
                    Cookie: cookie
                }
            });
        },
        delete: async (url: string, config: any = {}) => {
            return axios.delete(url, {
                ...config,
                headers: {
                    ...config.headers,
                    Cookie: cookie
                }
            });
        }
    };
}
