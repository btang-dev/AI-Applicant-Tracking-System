import { Navigate, useLocation } from "react-router";

const Auth = () => {
    const location = useLocation();

    return <Navigate to={`/${location.search}`} replace />;
};

export default Auth;
