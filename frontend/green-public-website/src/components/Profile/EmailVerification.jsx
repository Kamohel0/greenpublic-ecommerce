import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/api/authApi';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link: No token provided');
        return;
      }

      try {
        // Use GET request with proper encoding
        const response = await api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        
        if (response.status === 200) {
          setStatus('success');
          setMessage(response.data?.message || 'Email verified successfully! You can now log in.');
          setTimeout(() => {
            navigate('/login', { 
              state: { message: 'Email verified successfully! Please log in.' }
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Verification error:', error.response?.status || error.message);
        
        // Handle specific error cases from backend
        if (error.response?.status === 400) {
          const backendMessage = error.response.data?.message;
          if (backendMessage?.includes('Invalid verification token')) {
            setMessage('This verification link is invalid or has expired. Please request a new verification email.');
          } else {
            setMessage(backendMessage || 'Invalid verification token.');
          }
        } else if (error.response?.status === 500) {
          setMessage('Server error. Please try again later.');
        } else {
          setMessage('Network error. Please check your connection and try again.');
        }
        
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Verifying your email...
                </h2>
                <p className="mt-2 text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Verification Successful!
                </h2>
                <p className="mt-2 text-gray-600">{message}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Redirecting to login page...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-gray-600">{message}</p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate('/resend-verification')}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-200"
                  >
                    Request New Verification Email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;