"use client"

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie'


interface GoogleDoc {
  id: string;
  name: string;
}

interface ConversionResult {
  totalFiles: number;
  convertedFiles: {
    originalFileName: string;
    convertedFileName?: string;
    status: string;
    error?: string;
  }[];
  zipDownloadLink?: string;
}

function MarkdownConverter() {
  const [docs, setDocs] = useState<GoogleDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const navigate = useRouter();

  // Check authentication status (unchanged)
  const isAuthenticated = () => {
    const token = Cookie.get('googleAccessToken');
    const expiry = Cookie.get('tokenExpiry');
    return !!(token && expiry && Date.now() < parseInt(expiry));
  };

  // Initiate Google OAuth Login (unchanged)
  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get('https://markdown-to-docx.onrender.com/auth/google');
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError('Failed to initiate login');
    }
  };

  // Fetch Markdown Docs (unchanged)
  const fetchDocs = async () => {
    if (!isAuthenticated()) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const response = await axios.get('https://markdown-to-docx.onrender.com/api/docs', {
        headers: {
          'Authorization': `Bearer ${Cookie.get('googleAccessToken')}`
        }
      });

      setDocs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  // Convert Markdown Docs - Updated
  const handleConvertDocs = async () => {
    if (!isAuthenticated()) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setConversionResult(null);

    try {
      const response = await axios.post('https://markdown-to-docx.onrender.com/api/convert', {}, {
        headers: {
          'Authorization': `Bearer ${Cookie.get('googleAccessToken')}`
        }
      });

      setConversionResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  // New: Download Converted Files
  const handleDownloadZip = async () => {
    if (!conversionResult?.zipDownloadLink) {
      setError('No download link available');
      return;
    }

    try {


      const response = await axios.get('https://markdown-to-docx.onrender.com/api/download-zip', {
        headers: {
          'Authorization': `Bearer ${Cookie.get('googleAccessToken')}`
        },
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'converted_markdown_files.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Download failed');
    }
  };

  // Logout (unchanged)
  const handleLogout = () => {
    if(typeof window === 'undefined') return;
    Cookie.remove('googleAccessToken');
    Cookie.remove('googleRefreshToken');
    Cookie.remove('tokenExpiry');
    Cookie.remove('userInfo');
    navigate.push('/');
  };

  // Render - Updated to show conversion results
  return (
    <div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {!isAuthenticated() ? (
        <button onClick={handleGoogleLogin}>
          Login with Google
        </button>
      ) : (
        <>
          <button onClick={handleLogout}>Logout</button>
          
          <div>
            <h2>Markdown Documents</h2>
            <button onClick={fetchDocs} disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch Docs'}
            </button>

            {docs.length > 0 && (
              <>
                <ul>
                  {docs.map(doc => (
                    <li key={doc.id}>{doc.name}</li>
                  ))}
                </ul>

                <button 
                  onClick={handleConvertDocs} 
                  disabled={loading || docs.length === 0}
                >
                  {loading ? 'Converting...' : 'Convert Docs'}
                </button>
              </>
            )}

            {/* Conversion Results */}
            {conversionResult && (
              <div>
                <h3>Conversion Results</h3>
                <p>Total Files: {conversionResult.totalFiles}</p>
                
                <ul>
                  {conversionResult.convertedFiles.map((file, index) => (
                    <li key={index}>
                      {file.originalFileName} - 
                      {file.status === 'converted' 
                        ? `Converted (${file.convertedFileName})` 
                        : `Failed: ${file.error}`}
                    </li>
                  ))}
                </ul>

                <button onClick={handleDownloadZip}>
                  Download Converted Files (ZIP)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MarkdownConverter;