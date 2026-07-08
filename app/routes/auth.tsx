import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => ([
    { title: 'Resume Tracker | Auth' },
    { name: 'description', content: 'Log into your account.' },

])

const Auth = () => {
    const { isLoading, auth } = usePuterStore(); // Access the isLoading state from the Puter store.
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate(next);
    }, [auth.isAuthenticated, next]); // A redirection. If the user is authenticated, navigate to the next page. If they are not authenticated, they will stay on the auth page.
    
    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded 2xl p-10">
                    <div className="flex flex-col gap-2 text-center">
                        <h1>{auth.isAuthenticated ? "Account" : "Welcome"}</h1>
                        <h2>{auth.isAuthenticated ? "You are signed in" : "Log In to Continue your Job Journey"}</h2>
                    </div>
                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse">
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <> 
                                {auth.isAuthenticated ? (
                                    <button className="auth-button" onClick={auth.signOut}>
                                        <p>Log Out</p>
                                    </button> 
                                ) : (
                                    <button className="auth-button" onClick={auth.signIn}>
                                        <p>Login</p>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}
export default Auth
