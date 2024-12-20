"use client"

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookie from 'js-cookie';

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

  const isAuthenticated = () => {
    const token = Cookie.get('googleAccessToken');
    const expiry = Cookie.get('tokenExpiry');
    return !!(token && expiry && Date.now() < parseInt(expiry));
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await axios.get('https://markdown-to-docx.onrender.com/auth/google');
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError('Failed to initiate login');
    }
  };

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

  const handleLogout = () => {
    if(typeof window === 'undefined') return;
    Cookie.remove('googleAccessToken');
    Cookie.remove('googleRefreshToken');
    Cookie.remove('tokenExpiry');
    Cookie.remove('userInfo');
    navigate.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Markdown to DOCX Converter
          </h1>
          <p className="text-gray-600">
            Convert your Google Drive Markdown files to DOCX format
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {!isAuthenticated() ? (
            <div className="text-center">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login with Google
              </button>
            </div>
          ) : (
            <div>
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Markdown Documents
                </h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>

              {/* Fetch Documents Section */}
              <div className="mb-8">
                <button
                  onClick={fetchDocs}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching...' : 'Fetch Documents'}
                </button>
              </div>

              {/* Documents List */}
              {docs.length > 0 && (
                <div className="mb-8">
                  <ul className="divide-y divide-gray-200">
                    {docs.map(doc => (
                      <li key={doc.id} className="py-3">
                        <p className="text-gray-800">{doc.name}</p>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleConvertDocs}
                    disabled={loading || docs.length === 0}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Converting...' : 'Convert Documents'}
                  </button>
                </div>
              )}

              {/* Conversion Results */}
              {conversionResult && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Conversion Results
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Total Files: {conversionResult.totalFiles}
                  </p>

                  <ul className="mb-6 space-y-2">
                    {conversionResult.convertedFiles.map((file, index) => (
                      <li
                        key={index}
                        className={`p-3 rounded-md ${
                          file.status === 'converted'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span className="font-medium">{file.originalFileName}</span>
                        {file.status === 'converted' ? (
                          <span className="ml-2">→ {file.convertedFileName}</span>
                        ) : (
                          <span className="ml-2 text-red-600">
                            Failed: {file.error}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleDownloadZip}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Download Converted Files (ZIP)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarkdownConverter;