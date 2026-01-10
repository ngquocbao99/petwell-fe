import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf1e6] text-center p-4">
            <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Oops! The page you are looking for doesn't exist.</p>
            <Link
                to="/"
                className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow hover:bg-orange-600 transition-all"
            >
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
