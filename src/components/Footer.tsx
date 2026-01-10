import { Link } from "react-router-dom";
import logo from "../assets/logo.jpg";
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

const Footer = () => {
    return (
        <footer className="bg-[#fdf1e6] border-t border-gray-300 mt-5">
            <div className="container mx-auto py-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm text-gray-700">
                {/* Logo & About */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left ml-5">
                    <img src={logo} alt="Pet Well" className="w-20 h-20 rounded-full mb-4 shadow-md" />
                    <p>
                        <strong>PetWell</strong> - A trusted pet care system providing the best services and products for your beloved pets.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="ml-5">
                    <h3 className="font-bold mb-4 text-lg">Explore Our Pet Services</h3>
                    <ul className="space-y-2">
                        <li><Link className="hover:text-orange-500 transition" to="/">Home</Link></li>
                        <li><Link className="hover:text-orange-500 transition" to="/services">Services</Link></li>
                        <li><Link className="hover:text-orange-500 transition" to="/products">Products</Link></li>
                        <li><Link className="hover:text-orange-500 transition" to="/contact">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="ml-5">
                    <h3 className="font-bold mb-4 text-lg">Contact</h3>
                    <p>
                        Address: 600 Nguyen Van Cu Extension, An Binh Ward, Binh Thuy District, Can Tho City 900000, Vietnam <br />
                        Hotline: <a href="tel:18009999" className="text-orange-500 font-semibold">1800 9999</a> <br />
                        Email: <a href="mailto:petwellsu25@gmail.com" className="hover:underline">petwellsu25@gmail.com</a>
                    </p>
                </div>

                {/* Social */}
                <div className="ml-5">
                    <h3 className="font-bold mb-4 text-lg">Connect With Us</h3>
                    <div className="flex space-x-4 justify-center md:justify-start">
                        <a href="https://facebook.com" target="_blank" className="hover:text-orange-500 transition">
                            <FacebookIcon sx={{ color: '#1877F2', transition: '0.3s' }} fontSize="large" />
                        </a>
                        <a href="https://instagram.com" target="_blank" className="hover:text-orange-500 transition">
                            <InstagramIcon sx={{ color: '#E1306C', transition: '0.3s' }} fontSize="large" />
                        </a>
                        <a href="https://youtube.com" target="_blank" className="hover:text-orange-500 transition">
                            <YouTubeIcon sx={{ color: '#FF0000', transition: '0.3s' }} fontSize="large" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-200 text-center py-4 text-xs text-gray-500">
                © 2025 <span className="font-semibold text-orange-500">PetWell</span>. All Rights Reserved.
            </div>
        </footer>
    );
};

export default Footer;
