import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { SITE_NAME } from "~/lib/brand";
import { usePuterStore } from "~/lib/puter";

const Navbar = () => {
    const { auth, isLoading } = usePuterStore();
    const navigate = useNavigate();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);

        try {
            await auth.signOut();
            navigate("/", { replace: true });
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <header className="navbar">
            <Link to="/home" className="navbar-brand" aria-label={`${SITE_NAME} dashboard`}>
                <img
                    className="navbar-brand-mark"
                    src="/favicon.svg?v=2"
                    alt=""
                    aria-hidden="true"
                />
                <span className="navbar-brand-copy">
                    <strong>{SITE_NAME}</strong>
                    <small>Illuminate your fit.</small>
                </span>
            </Link>

            <nav className="navbar-links" aria-label="Dashboard navigation">
                <NavLink
                    to="/home"
                    end
                    className={({ isActive }) =>
                        `navbar-link${isActive ? " navbar-link-active" : ""}`
                    }
                >
                    Home
                </NavLink>
                <NavLink
                    to="/upload"
                    className={({ isActive }) =>
                        `navbar-link${isActive ? " navbar-link-active" : ""}`
                    }
                >
                    Upload Resume
                </NavLink>
                <button
                    type="button"
                    className="navbar-sign-out"
                    onClick={() => void handleSignOut()}
                    disabled={isLoading || isSigningOut}
                    aria-busy={isSigningOut}
                >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
            </nav>
        </header>
    );
};

export default Navbar
