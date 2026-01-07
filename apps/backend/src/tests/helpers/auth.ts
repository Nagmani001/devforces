import { BACKEND_URL } from "../../lib/config";
import { axios } from "../../lib/utils";
import { createUser } from "./user";
import { createAdminUser } from "./contest";

/**
 * Helper to get JWT token by signing up and signing in
 * Note: This requires the user to be verified, which might need OTP verification in production
 */
export async function getAuthToken(user: { email: string; password: string; username: string }, isAdmin = false) {
    // Create user in database
    if (isAdmin) {
        await createAdminUser(user);
    } else {
        await createUser(user);
    }

    // Sign in to get token
    const signinRes = await axios.post(`${BACKEND_URL}/api/auth/signin`, {
        email: user.email,
        password: user.password
    });

    if (signinRes.status !== 200) {
        throw new Error(`Failed to get auth token: ${JSON.stringify(signinRes.data)}`);
    }

    return signinRes.data.token;
}

/**
 * Helper to make authenticated requests
 */
export function createAuthAxios(token: string) {
    return {
        get: async (url: string, config: any = {}) => {
            return axios.get(url, {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${token}`
                }
            });
        },
        post: async (url: string, data: any, config: any = {}) => {
            return axios.post(url, data, {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${token}`
                }
            });
        },
        put: async (url: string, data: any, config: any = {}) => {
            return axios.put(url, data, {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${token}`
                }
            });
        },
        delete: async (url: string, config: any = {}) => {
            return axios.delete(url, {
                ...config,
                headers: {
                    ...config.headers,
                    Authorization: `Bearer ${token}`
                }
            });
        }
    };
}
