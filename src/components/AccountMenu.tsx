import { useState, useEffect } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Menu, MenuItem, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { logout } from '../store/userSlice';
import { useDispatch } from 'react-redux';

const AccountMenu = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate()
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('accesstoken');
            setIsLoggedIn(!!token);
        };

        checkLogin();
        window.addEventListener("user-login", checkLogin);

        return () => {
            window.removeEventListener("user-login", checkLogin);
        };
    }, []);


    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('accesstoken');
        localStorage.removeItem('userId');
        dispatch(logout());
        setIsLoggedIn(false);
        handleClose();
        window.dispatchEvent(new Event("user-login"));
        navigate('/')
    };

    return (
        <div>
            <IconButton onClick={handleClick} size="large">
                <AccountCircleIcon color='warning' fontSize="large" />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {isLoggedIn
                    ? [
                        <MenuItem key="profile" onClick={handleClose}>
                            <Link to="/dashboard/profile" className="font-roboto">
                                <PersonIcon color="warning" fontSize="medium" /> &nbsp; Profile
                            </Link>
                        </MenuItem>,
                        <MenuItem key="logout" onClick={handleLogout}>
                            <LogoutIcon color="warning" fontSize="medium" /> &nbsp; Logout
                        </MenuItem>
                    ]
                    : [
                        <MenuItem key="login" onClick={handleClose}>
                            <Link to="/auth/login">
                                <LoginIcon color="warning" fontSize="medium" /> &nbsp; Login
                            </Link>
                        </MenuItem>,
                        <MenuItem key="register" onClick={handleClose}>
                            <Link to="/auth/register">
                                <PersonAddIcon color="warning" fontSize="medium" /> &nbsp; Register
                            </Link>
                        </MenuItem>
                    ]}

            </Menu>
        </div>
    );
};

export default AccountMenu;
