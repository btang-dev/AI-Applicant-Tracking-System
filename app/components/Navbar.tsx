import { Link } from "react-router";
const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">
                <div className="flex flex-col">
                    <p className="text-2xl font-bold text-gradient">RoleLume</p>
                    <p className="text-xs text-dark-200 max-sm:hidden">Illuminate your fit for every role.</p>
                </div>
            </Link>
            <Link to="/upload" className="primary-button w-fit">
                Upload Resume
            </Link>
        </nav>
    )
}

export default Navbar
