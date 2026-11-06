
import axios from "axios";
import { BACKEND_SERVER_URL } from "./utl";

const verdictApi = axios.create({
    baseURL: `${BACKEND_SERVER_URL}/signup`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Read the existing login token
const getToken = () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) return null;

    try {
        return JSON.parse(savedToken);
    } catch {
        return savedToken;
    }
};

// Add JWT authentication when required
const getAuthConfig = () => {
    const token = getToken();

    if (!token) {
        throw new Error("Please login to vote.");
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Get public community verdicts
export const getCommunityVerdict = async (movieId) => {
    const response = await verdictApi.get(`/rating/${movieId}`);
    return response.data;
};

// Get current user's verdict
export const getMyVerdict = async (movieId) => {
    const response = await verdictApi.get(
        `/rating/${movieId}/me`,
        getAuthConfig()
    );

    return response.data;
};

// Submit or update verdict
export const submitMovieVerdict = async (movieId, verdict) => {
    const response = await verdictApi.post(
        `/rating/${movieId}`,
        { verdict },
        getAuthConfig()
    );

    return response.data;
};
