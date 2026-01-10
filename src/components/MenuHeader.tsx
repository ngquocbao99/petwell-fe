import { Link } from 'react-router-dom';

const MenuHeader = () => {
    return (
        <nav className="flex space-x-5 text-gray-700 font-medium items-center">
            <Link className='hover:bg-white px-3 py-2 rounded' to="/">Home</Link>
            <Link className='hover:bg-white px-3 py-2 rounded' to="/services">Services</Link>
            <Link className='hover:bg-white px-3 py-2 rounded' to="/general">Knowledge</Link>
            <Link className='hover:bg-white px-3 py-2 rounded' to="/contact">Contact</Link>
        </nav>
    );
};

export default MenuHeader;
