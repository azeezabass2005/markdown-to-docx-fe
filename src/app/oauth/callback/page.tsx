"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookie from 'js-cookie'


function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useRouter();
  const urlParams = useSearchParams();
  const code = urlParams.get('code');


  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Extract authorization code from URL
      if (!code) {
        setError('No authorization code found');
        return;
      }
      console.log(code, "This is code")

      try {
        console.log("Should send")
        // Send authorization code to backend
        const response = await axios.post('https://markdown-to-docx.onrender.com/auth/google/callback', { 
          code: code
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log("After sending")
        console.log(response, "This is the response from the axios")
         // Store tokens and user info
         Cookie.set('googleAccessToken', response.data.access_token);
         Cookie.set('googleRefreshToken', response.data.refresh_token || '');
         Cookie.set('userInfo', JSON.stringify(response.data.user));
 
         // Calculate token expiry (1 hour from now)
         const expiryTime = Date.now() + 3600000;
         Cookie.set('tokenExpiry', expiryTime.toString());

        // Redirect to main application
        navigate.push('/');
      } catch (err: any) {
        console.error('Authentication error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [navigate, code]);

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

// Tongue scraper
