import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_EMAILS } from '../constants';
import { supabase } from '../../../lib/supabase';
import AuthHeader from '../components/AuthHeader';
import AuthForm from '../components/AuthForm';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '', show: false });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { loginWithEmail, signUpWithEmailAuth, resetPasswordAuth } = useAuth();
  const navigate = useNavigate();


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        await signUpWithEmailAuth(creds.email, creds.password);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/');
        } else {
          setMessage('Account created! ইমেইলে গিয়ে confirmation লিংকে ক্লিক করুন, তারপর sign in করুন।');
          setIsSignUp(false);
        }
      } else {
        const user = await loginWithEmail(creds.email, creds.password);
        if (user && user.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) navigate('/dashboard');
        else navigate('/');
      }
    } catch (err: any) {
      console.error('Auth handler error:', err);
      let msg = 'Authentication failed. Please try again.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password. Please verify and try again.';
      else if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      else if (err.code === 'auth/email-already-in-use' || err.message?.toLowerCase().includes('already registered') || err.code === 'user_already_exists') msg = 'This email is already registered. Please sign in instead.';
      else if (err.code === 'weak_password' || err.message?.toLowerCase().includes('password should be')) msg = 'Password must be at least 6 characters long.';
      else if (err.message) msg = err.message;
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <AuthHeader />
        <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">{isSignUp ? 'Create Account' : 'Sign In'}</h2>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-6 flex items-center gap-3 text-red-600 text-sm">
            <div className="shrink-0 p-1 bg-red-100 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-medium">
              {error.toLowerCase().includes('network-request-failed') 
                ? 'Network connection error. please refresh the page or check your internet.' 
                : error}
            </p>
          </div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-6 flex items-center gap-3 text-emerald-600 text-sm">
            <div className="shrink-0 p-1 bg-emerald-100 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium">{message}</p>
          </div>
        )}
        {isSignUp ? (
          <div className="space-y-4">
            <AuthForm isSignUp email={creds.email} setEmail={e => setCreds({...creds, email: e})} password={creds.password} setPassword={e => setCreds({...creds, password: e})} showPassword={creds.show} setShowPassword={s => setCreds({...creds, show: s})} onSubmit={handleAuth} />
            <GoogleSignInButton label="Continue with Google" />
          </div>
        ) : (
          <div className="space-y-4">
            <AuthForm isSignUp={false} email={creds.email} setEmail={e => setCreds({...creds, email: e})} password={creds.password} setPassword={e => setCreds({...creds, password: e})} showPassword={creds.show} setShowPassword={s => setCreds({...creds, show: s})} onSubmit={handleAuth} />
            <GoogleSignInButton label="Continue with Google" />
          </div>
        )}
        <AuthToggle isSignUp={isSignUp} onToggle={() => setIsSignUp(!isSignUp)} />

        {/* Embedded Video Guide */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black">
            <iframe
              src="https://www.youtube.com/embed/m6c_D51pOZ0"
              title="Video Guide"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthToggle({ isSignUp, onToggle }: any) {
  return (
    <p className="mt-6 text-center text-sm text-slate-600">
      {isSignUp ? 'Already have an account?' : "Don't have an account?"}
      <button onClick={onToggle} className="text-blue-600 font-medium ml-1">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
    </p>
  );
}
