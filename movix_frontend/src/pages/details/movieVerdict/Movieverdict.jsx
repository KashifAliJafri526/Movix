
import React, { useEffect, useState } from "react";
import {
    getCommunityVerdict,
    getMyVerdict,
    submitMovieVerdict,
} from "../../../utils/verdictApi";

import "./Movieverdict.scss";

const verdictOptions = [
    {
        id: "money-waste",
        label: "Money Waste",
        emoji: "💸",
        description: "Not worth your money or time.",
    },
    {
        id: "time-pass",
        label: "Time Pass",
        emoji: "😐",
        description: "Decent watch, nothing special.",
    },
    {
        id: "potential-man",
        label: "Potential Man",
        emoji: "🔥",
        description: "Good potential, but something is missing.",
    },
    {
        id: "go-for-it",
        label: "Go For It",
        emoji: "🍿",
        description: "Definitely worth watching.",
    },
    {
        id: "perfection",
        label: "Perfection",
        emoji: "👑",
        description: "An absolute masterpiece.",
    },
];

const MovieVerdict = ({ movieId, isLoggedIn }) => {
    const [community, setCommunity] = useState(null);
    const [myVerdict, setMyVerdict] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchVerdicts = async () => {
        try {
            setLoading(true);
            setError("");

            const communityData = await getCommunityVerdict(movieId);
            setCommunity(communityData);

            if (isLoggedIn) {
                try {
                    const personalData = await getMyVerdict(movieId);
                    setMyVerdict(personalData.myVerdict || null);
                } catch (err) {
                    console.error("Unable to fetch personal verdict:", err);
                    setMyVerdict(null);
                }
            } else {
                setMyVerdict(null);
            }
        } catch (err) {
            console.error("Verdict loading error:", err);
            setError("Unable to load community verdicts. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerdicts();
    }, [movieId, isLoggedIn]);

    const handleVote = async (verdict) => {
        if (!isLoggedIn) {
            setError("Please login to submit your verdict.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            await submitMovieVerdict(movieId, verdict);

            setMyVerdict(verdict);
            setSuccess("Your verdict has been saved!");

            // Refresh community statistics
            const updatedCommunity = await getCommunityVerdict(movieId);
            setCommunity(updatedCommunity);
        } catch (err) {
            console.error("Verdict submission error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to save your verdict."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="movieVerdict loading">
                Loading Movix Verdict...
            </div>
        );
    }

    return (
        <section className="movieVerdict">
            <div className="verdictHeader">
                <div>
                    <span className="verdictEyebrow">THE COMMUNITY HAS SPOKEN</span>
                    <h2>Movix Verdict</h2>
                    <p>What do you think about this movie?</p>
                </div>

                <div className="totalRatings">
                    <strong>{community?.totalRatings || 0}</strong>
                    <span>Community Votes</span>
                </div>
            </div>

            <div className="verdictOptions">
                {verdictOptions.map((option) => {
                    const count =
                        community?.distribution?.[option.id] || 0;

                    const percentage =
                        community?.percentages?.[option.id] || 0;

                    const selected = myVerdict === option.id;

                    return (
                        <button
                            type="button"
                            key={option.id}
                            className={`verdictCard ${option.id} ${
                                selected ? "selected" : ""
                            }`}
                            onClick={() => handleVote(option.id)}
                            disabled={submitting || !isLoggedIn}
                        >
                            <div className="verdictCardTop">
                                <span className="verdictEmoji">
                                    {option.emoji}
                                </span>

                                {selected && (
                                    <span className="selectedBadge">
                                        YOUR VOTE
                                    </span>
                                )}
                            </div>

                            <h3>{option.label}</h3>
                            <p>{option.description}</p>

                            <div className="verdictStats">
                                <div className="verdictProgress">
                                    <div
                                        className="verdictProgressFill"
                                        style={{
                                            width: `${percentage}%`,
                                        }}
                                    />
                                </div>

                                <div className="verdictNumbers">
                                    <span>{count} votes</span>
                                    <strong>{percentage}%</strong>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="verdictFooter">
                {isLoggedIn ? (
                    <p>
                        {myVerdict
                            ? "You can change your verdict anytime."
                            : "Select a category to submit your verdict."}
                    </p>
                ) : (
                    <p>Login to cast your vote and share your opinion.</p>
                )}

                {submitting && <span>Saving your verdict...</span>}
                {success && <span className="successMessage">{success}</span>}
                {error && <span className="errorMessage">{error}</span>}
            </div>
        </section>
    );
};

export default MovieVerdict;
