import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import logo from "../assets/logo.jpg";
import MenuHeader from "./MenuHeader";
import AccountMenu from "./AccountMenu";

const Header = () => {
    const navigate = useNavigate();
    const { userId } = useSelector((state: RootState) => state.user);

    const handleChatClick = () => {
        if (userId) {
            navigate('/chat');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-20 h-24 lg:h-20 shadow-md bg-[#fdf1e6] flex items-center">
            <div className="container mx-auto flex items-center justify-between px-4">
                {/* Logo */}
                <Link to={"/"} className="flex items-center">
                    <img
                        src={logo}
                        width={60}
                        height={60}
                        alt='logo'
                        className='rounded-full'
                    />
                </Link>

                {/* Menu */}
                <div className="flex justify-center w-full">
                    <MenuHeader />
                </div>

                {/* Chat and Account */}
                <div className="flex items-center gap-4">
                    {userId && (
                        <button
                            onClick={handleChatClick}
                            className="p-2 hover:bg-orange-100 rounded-full transition-colors relative"
                            title="Chat"
                        >
                            <IoChatbubbleEllipsesOutline className="text-2xl text-orange-500" />
                        </button>
                    )}
                    <AccountMenu />
                </div>
            </div>
        </header>
    );
};

export default Header;
