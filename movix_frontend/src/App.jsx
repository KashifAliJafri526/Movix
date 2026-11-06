
import { useState, useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import { fetchDataFromApi } from "./utils/api";
import { useSelector, useDispatch } from "react-redux";
import { getApiConfiguration, getGenres } from "./store/homeSlice";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";
import Details from "./pages/details/Details";
import SearchResult from "./pages/searchResult/SearchResult";
import Explore from "./pages/explore/Explore";
import PageNotFound from "./pages/404/PageNotFound";

import Login from "./Login/Login";
import Register from "./Login/Register";
import ChangePassword from "./Login/changePassword";

// Check whether saved JWT exists and is valid
const getValidToken = () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) return null;

    try {
        let token = savedToken;

        // Support both JSON-stringified and normal JWT formats
        try {
            token = JSON.parse(savedToken);
        } catch {
            token = savedToken;
        }

        if (typeof token !== "string") return null;

        const payload = token.split(".")[1];

        if (!payload) return null;

        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decodedPayload = JSON.parse(
            atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
        );

        // JWT expiration is in seconds
        if (!decodedPayload.exp || decodedPayload.exp * 1000 <= Date.now()) {
            return null;
        }

        return token;

    } catch (error) {
        console.error("Invalid saved login token:", error);
        return null;
    }
};

function App() {
    const dispatch = useDispatch();

    const { url } = useSelector((state) => state.home);

    const [isLoggedIn, setIsLoggedIn] = useState(
        () => Boolean(getValidToken())
    );

    const [changePass, setChangePass] = useState(false);
    const [enable, setEnable] = useState(true);
    const [dataFromChild, setDataFromChild] = useState(null);

    // Login successful
    const handleLogIn = () => {
        const token = getValidToken();

        if (token) {
            setIsLoggedIn(true);
        } else {
            console.error("No valid login token found.");
            setIsLoggedIn(false);
        }
    };

    // Change password
    const handleChangePass = () => {
        setChangePass(true);
    };

    // Disable login screen
    const handleEnable = () => {
        setEnable(false);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");

        setIsLoggedIn(false);
        setEnable(true);
        setChangePass(false);
        setDataFromChild(null);
    };

    // Remove expired or invalid tokens
    useEffect(() => {
        if (!getValidToken()) {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
        }
    }, []);

    // Fetch TMDB configuration and genres
    useEffect(() => {
        fetchApiConfig();
        genresCall();
    }, []);

    // Receive user data from Login component
    const handleDataFromChild = (username, email) => {
        setDataFromChild({ username, email });
    };

    // Fetch TMDB API configuration
    const fetchApiConfig = () => {
        fetchDataFromApi("/configuration").then((res) => {
            if (!res?.images?.secure_base_url) {
                console.error("Unable to fetch TMDB configuration");
                return;
            }

            const url = {
                backdrop: res.images.secure_base_url + "original",
                poster: res.images.secure_base_url + "original",
                profile: res.images.secure_base_url + "original",
            };

            dispatch(getApiConfiguration(url));
        });
    };

    // Fetch movie and TV genres
    const genresCall = async () => {
        try {
            const endPoints = ["tv", "movie"];

            const promises = endPoints.map((mediaType) =>
                fetchDataFromApi(`/genre/${mediaType}/list`)
            );

            const data = await Promise.all(promises);

            const allGenres = {};

            data.forEach((item) => {
                if (item?.genres) {
                    item.genres.forEach((genre) => {
                        allGenres[genre.id] = genre;
                    });
                }
            });

            dispatch(getGenres(allGenres));

        } catch (error) {
            console.error("Error fetching genres:", error);
        }
    };

    return (
        <BrowserRouter>

            {/* Header only for logged-in users */}
            {isLoggedIn && (
                <Header
                    dataFromChild={dataFromChild}
                    handleLogout={handleLogout}
                />
            )}

            <Routes>

                {/* Login */}
                {enable && (
                    <Route
                        path="/login2"
                        element={
                            <Login
                                handleEnable={handleEnable}
                                handleLogin={handleLogIn}
                                handleChangePass={handleChangePass}
                                sendDataToParent={handleDataFromChild}
                            />
                        }
                    />
                )}

                {/* PUBLIC MOVIE / TV DETAILS */}
                <Route
                    path="/:mediaType/:id"
                    element={
                        <Details isLoggedIn={isLoggedIn} />
                    }
                />

                {/* Protected Search */}
                <Route
                    path="/search/:query"
                    element={
                        isLoggedIn ? (
                            <SearchResult />
                        ) : (
                            <Navigate to="/login2" />
                        )
                    }
                />

                {/* Protected Explore */}
                <Route
                    path="/explore/:mediaType"
                    element={
                        isLoggedIn ? (
                            <Explore />
                        ) : (
                            <Navigate to="/login2" />
                        )
                    }
                />

                {/* Register */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* Change Password */}
                <Route
                    path="/changePass"
                    element={
                        changePass ? (
                            <ChangePassword />
                        ) : (
                            <Navigate to="/login2" />
                        )
                    }
                />

                {/* Home */}
                <Route
                    path="/"
                    element={
                        isLoggedIn ? (
                            <Home />
                        ) : (
                            <Navigate to="/login2" />
                        )
                    }
                />

                {/* 404 */}
                <Route
                    path="*"
                    element={<PageNotFound />}
                />

            </Routes>

            {/* Footer only for logged-in users */}
            {isLoggedIn && <Footer />}

        </BrowserRouter>
    );
}

export default App;
