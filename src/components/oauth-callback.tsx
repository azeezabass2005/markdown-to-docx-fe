"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookie from 'js-cookie';

function OAuthCallback() {
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    useEffect(() => {
        let isMounted = true;

        const handleOAuthCallback = async () => {
            try {
                // Validate authorization code
                if (!code) {
                    setError('No authorization code found');
                    setIsProcessing(false);
                    return;
                }

                // Send authorization code to backend
                const response = await axios.post(
                    'https://markdown-to-docx.onrender.com/auth/google/callback',
                    { code },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000 // 10 second timeout
                    }
                );

                // Only proceed if component is still mounted
                if (!isMounted) return;

                if (response.data) {
                    // Store tokens securely
                    const { access_token, refresh_token, user } = response.data;

                    // Set cookies with proper configuration
                    const cookieOptions = {
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax' as const,
                        expires: 7 // 7 days
                    };

                    Cookie.set('googleAccessToken', access_token, cookieOptions);

                    if (refresh_token) {
                        Cookie.set('googleRefreshToken', refresh_token, cookieOptions);
                    }

                    if (user) {
                        Cookie.set('userInfo', JSON.stringify(user), cookieOptions);
                    }

                    // Set token expiry (1 hour from now)
                    const expiryTime = Date.now() + 3600000;
                    Cookie.set('tokenExpiry', expiryTime.toString(), cookieOptions);

                    // Redirect to home page
                    router.push('/');
                    router.refresh(); // Refresh the page to update authentication state
                }
            } catch (err: any) {
                if (!isMounted) return;

                console.error('Authentication error:', err);
                const errorMessage = err.response?.data?.message || 'Authentication failed. Please try again.';
                setError(errorMessage);
            } finally {
                if (isMounted) {
                    setIsProcessing(false);
                }
            }
        };

        handleOAuthCallback();

        // Cleanup function to prevent memory leaks and state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, [code, router]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
                    <h2 className="text-red-800 text-xl font-semibold mb-4">Authentication Error</h2>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
                <h2 className="text-gray-800 text-xl font-semibold mb-4">
                    Processing Authentication
                </h2>
                <p className="text-gray-600">
                    Please wait while we complete the login process...
                </p>
            </div>
        </div>
    );
}

export default OAuthCallback;