
import React, { useState, useEffect } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { SlMenu } from "react-icons/sl";
import { VscChromeClose } from "react-icons/vsc";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";

import "./style.scss";

import ContentWrapper from "../contentWrapper/ContentWrapper";
import logo from "../../assets/movix-logo.svg";
import { BACKEND_SERVER_URL } from "../../utils/utl";

const Header = ({ handleLogout, dataFromChild }) => {
  const [show, setShow] = useState("top");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [userData, setUserData] = useState(dataFromChild || null);

  const navigate = useNavigate();
  const location = useLocation();

  // Restore user details after refresh
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const savedToken = localStorage.getItem("token");

        if (!savedToken) return;

        let token;

        try {
          token = JSON.parse(savedToken);
        } catch {
          token = savedToken;
        }

        if (!token) return;

        const payload = JSON.parse(
          atob(
            token.split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
              .padEnd(
                Math.ceil(token.split(".")[1].length / 4) * 4,
                "="
              )
          )
        );

        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
          handleLogout();
          return;
        }

        const response = await axios.get(
          `${BACKEND_SERVER_URL}/signup/getUser/${payload.userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserData(response.data.user);
      } catch (error) {
        console.error("Unable to restore user details:", error);
      }
    };

    fetchUserDetails();
  }, [handleLogout]);

  // Update user details when Login sends them
  useEffect(() => {
    if (dataFromChild) {
      setUserData(dataFromChild);
    }
  }, [dataFromChild]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const controlNavbar = () => {
    if (window.scrollY > 200) {
      if (window.scrollY > lastScrollY && !mobileMenu) {
        setShow("hide");
      } else {
        setShow("show");
      }
    } else {
      setShow("top");
    }

    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);

    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY, mobileMenu]);

  const searchQueryHandler = (event) => {
    if (event.key === "Enter" && query.trim().length > 0) {
      navigate(`/search/${encodeURIComponent(query.trim())}`);

      setTimeout(() => {
        setShowSearch(false);
      }, 500);
    }
  };

  const openSearch = () => {
    setMobileMenu(false);
    setShowSearch(true);
  };

  const openMobileMenu = () => {
    setMobileMenu(true);
    setShowSearch(false);
  };

  const navigationHandler = (type) => {
    if (type === "movie") {
      navigate("/explore/movie");
    } else {
      navigate("/explore/tv");
    }

    setMobileMenu(false);
  };

  const logoutHandler = () => {
    setUserData(null);
    handleLogout();
    navigate("/login2");
  };

  return (
    <header className={`header ${mobileMenu ? "mobileView" : ""} ${show}`}>
      <ContentWrapper>
        <div className="logo" onClick={() => navigate("/")}>
          <img src={logo} alt="Movix" />
        </div>

        <ul className="menuItems">
          <li className="menuItem" onClick={() => navigationHandler("movie")}>
            Movies
          </li>

          <li className="menuItem" onClick={() => navigationHandler("tv")}>
            TV Shows
          </li>

          <li className="menuItem">
            <HiOutlineSearch onClick={openSearch} />
          </li>
        </ul>

        <div className="mobileMenuItems">
          <HiOutlineSearch onClick={openSearch} />

          {mobileMenu ? (
            <VscChromeClose onClick={() => setMobileMenu(false)} />
          ) : (
            <SlMenu onClick={openMobileMenu} />
          )}
        </div>
      </ContentWrapper>

      {showSearch && (
        <div className="searchBar">
          <ContentWrapper>
            <div className="searchInput">
              <input
                type="text"
                placeholder="Search for a movie or tv show...."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyUp={searchQueryHandler}
              />

              <VscChromeClose onClick={() => setShowSearch(false)} />
            </div>
          </ContentWrapper>
        </div>
      )}

      <div className="dropdown">
        <div className="username">
          {userData?.username || userData?.email?.split("@")[0] || "Account"}
        </div>

        <div className="dropdown-content">
          <Link to="#" onClick={(e) => e.preventDefault()}>
            {userData?.email || "Loading account..."}
          </Link>

          <Link
            to="/login2"
            onClick={(e) => {
              e.preventDefault();
              logoutHandler();
            }}
          >
            Logout
          </Link>

          <Link
            to="#"
            onClick={(e) => e.preventDefault()}
          >
            Your subscription
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
