"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Extract authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        setError('No authorization code found');
        return;
      }

      try {
        // Send authorization code to backend
        const response = await axios.post('http://localhost:3500/auth/google/callback', { 
          code 
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

       if(typeof window !== 'undefined') {
         // Store tokens and user info
         localStorage.setItem('googleAccessToken', response.data.access_token);
         localStorage.setItem('googleRefreshToken', response.data.refresh_token || '');
         localStorage.setItem('userInfo', JSON.stringify(response.data.user));
 
         // Calculate token expiry (1 hour from now)
         const expiryTime = Date.now() + 3600000;
         localStorage.setItem('tokenExpiry', expiryTime.toString());
       }

        // Redirect to main application
        navigate.push('/');
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate.push('/')}>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Processing Authentication...</h2>
      <p>Please wait while we complete the login process.</p>
    </div>
  );
}

export default OAuthCallback;