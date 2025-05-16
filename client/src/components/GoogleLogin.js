import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                const response = await fetch('https://s89-akhil-bookaura-2.onrender.com/router/auth/google/callback', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    // Pass both user data and token to login function
                    login(data.user, data.token);
                    // Store token in localStorage for API interceptor
                    if (data.token) {
                        localStorage.setItem('authToken', data.token);
                        console.log('Google auth token stored in localStorage');
                    }
                    navigate('/');
                } else {
                    throw new Error('Google authentication failed');
                }
            } catch (error) {
                console.error('Error during Google authentication:', error);
                navigate('/login');
            }
        };

        handleGoogleCallback();
    }, [navigate, login]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Completing Google Sign In...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleLogin;