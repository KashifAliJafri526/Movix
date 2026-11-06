
import axios from "axios";

const BASE_URL = "https://api.themoviedb.org/3";

const TMDB_TOKEN = import.meta.env.VITE_APP_TMDB_TOKEN;

const headers = {
  accept: "application/json",
  Authorization: `Bearer ${TMDB_TOKEN}`,
};

export const fetchDataFromApi = async (url, params = {}) => {
  try {
    if (!TMDB_TOKEN) {
      throw new Error("TMDB API token is missing. Check your frontend .env file.");
    }

    const { data } = await axios.get(`${BASE_URL}${url}`, {
      headers,
      params,
    });

    return data;
  } catch (err) {
    console.error(
      "TMDB API Error:",
      err.response?.data || err.message
    );

    throw err;
  }
};
