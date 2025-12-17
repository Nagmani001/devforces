import axios from "axios";

export const BASE_URL = "http://localhost:3001";

export async function getUserInfo(token: string) {
  try {
    const me = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    return {
      success: true,
      data: me.data
    }
  } catch (err) {
    return {
      success: false,
    }
  }
}

export async function getCourses(token: string, page: string) {
  try {
    const me = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: token
      }
    });
    let courses;
    let isAdmin;
    if (me.data.isAdmin) {
      isAdmin = true;
      try {
        const response = await axios.get(`${BASE_URL}/api/admin/contest?page=${page}`, {
          headers: {
            Authorization: token
          }
        });
        courses = response.data;
      } catch (err) {
        return {
          success: false,
          message: "invalid or missing token"
        }
      }

    } else {
      isAdmin = false;
      try {
        const response = await axios.get(`${BASE_URL}/api/user/contest?page=${page}`, {
          headers: {
            Authorization: token
          }
        });
        courses = response.data;
      } catch (err) {
        return {
          success: false,
          message: "invalid or missing token"
        }
      }
    }

    return {
      success: true,
      courses,
      isAdmin,
    }
  } catch (err) {
    return {
      success: false,
      message: "invalid or missing token"
    }
  }
}
