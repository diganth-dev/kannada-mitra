import { useState } from 'react';
import karnatakaIllustratedBg from '../assets/karnataka-illustrated-bg.png';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  resetPassword,
  validateSignUpForm,
  validateEmail,
  validatePassword,
  formatAuthErrorMessage,
} from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

/**
 * Kannada Mitra Stylized Logo
 * Radiant rising sun, open book with Kannada letter 'ಅ'
 */
function KannadaMitraLogo() {
  return (
    <div className="flex flex-row items-center justify-center gap-4 sm:gap-5 text-left">
      <div className="relative w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center shrink-0 drop-shadow-md">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Sun Rays */}
          <g fill="#F59E0B">
            <rect x="47" y="4" width="6" height="13" rx="3" />
            <rect x="22" y="14" width="5" height="12" rx="2.5" transform="rotate(-35 24 20)" />
            <rect x="73" y="14" width="5" height="12" rx="2.5" transform="rotate(35 76 20)" />
            <rect x="8" y="32" width="5" height="11" rx="2.5" transform="rotate(-65 10 37)" />
            <rect x="87" y="32" width="5" height="11" rx="2.5" transform="rotate(65 89 37)" />
          </g>

          {/* Golden Sun */}
          <circle cx="50" cy="38" r="15" fill="#FBBF24" />

          {/* Book Outer Cover - Karnataka Red */}
          <path
            d="M 50 48 Q 28 42 6 48 C 6 74 24 88 50 96 C 76 88 94 74 94 48 Q 72 42 50 48 Z"
            fill="#DC2626"
          />

          {/* Book Inner Page - Golden Yellow */}
          <path
            d="M 50 51 Q 30 45 10 51 C 10 71 27 84 50 92 C 73 84 90 71 90 51 Q 70 45 50 51 Z"
            fill="#F59E0B"
          />

          {/* Book Pages - Creamy White */}
          <path
            d="M 50 53 Q 32 48 14 53 C 14 69 29 80 50 88 C 71 80 86 69 86 53 Q 68 48 50 53 Z"
            fill="#FFFFFF"
          />

          {/* Center Spine Divider */}
          <line x1="50" y1="53" x2="50" y2="88" stroke="#E5E7EB" strokeWidth="1.5" />

          {/* Kannada Character 'ಅ' */}
          <text
            x="50"
            y="74"
            textAnchor="middle"
            fontSize="19"
            fontWeight="bold"
            fontFamily="'Noto Sans Kannada', sans-serif"
            fill="#1F2937"
          >
            ಅ
          </text>
        </svg>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 leading-tight">
          Kannada <span className="text-[#DC2626]">Mitra</span>
        </h1>
        <p className="text-sm sm:text-base font-semibold text-stone-600 tracking-wide">
          Kannada for Everyone
        </p>
      </div>
    </div>
  );
}

export const AuthScreen = ({ onAuthSuccess }) => {
  // View states: 'options' (3-button layout as in photo) | 'signin' (email form) | 'signup' (account creation form) | 'forgot-password'
  const [view, setView] = useState('options');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const configured = isFirebaseConfigured();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate inputs
    if (view === 'signup') {
      const formError = validateSignUpForm(email, password, confirmPassword);
      if (formError) {
        setErrorMessage(formError);
        return;
      }
    } else {
      const emailErr = validateEmail(email);
      if (emailErr) {
        setErrorMessage(emailErr);
        return;
      }
      const passErr = validatePassword(password);
      if (passErr) {
        setErrorMessage(passErr);
        return;
      }
    }

    // Check Firebase configuration
    if (!configured) {
      setErrorMessage(
        'Firebase Authentication is not configured. Please add your Firebase credentials in .env before signing in.'
      );
      return;
    }

    setIsLoading(true);
    try {
      let user;
      if (view === 'signup') {
        user = await signUpWithEmail(email, password, displayName);
        setSuccessMessage('Account created successfully! Redirecting...');
      } else {
        user = await signInWithEmail(email, password);
        setSuccessMessage('Welcome back! Logging you in...');
      }
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }

    if (!configured) {
      setErrorMessage(
        'Firebase Authentication is not configured. Please add your Firebase credentials in .env before resetting password.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage(`Password reset link sent to ${email.trim()}! Please check your inbox.`);
      setIsResetSent(true);
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!configured) {
      setErrorMessage(
        'Google Sign-In requires Firebase to be configured. Please add your Firebase credentials in .env.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      setSuccessMessage('Signed in with Google! Redirecting...');
      if (onAuthSuccess) {
        onAuthSuccess(user);
      }
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-center items-center py-10 sm:py-16 px-4 sm:px-6 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${karnatakaIllustratedBg})`,
        backgroundColor: '#FAF7EE',
      }}
    >
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl mx-auto space-y-7">
        {/* Kannada Mitra Logo & Title Header */}
        <div className="text-center">
          <KannadaMitraLogo />
        </div>

        {/* Central White Login Card */}
        <div className="bg-white rounded-3xl sm:rounded-[36px] p-8 sm:p-12 shadow-2xl border border-stone-200/80 relative overflow-hidden">
          {/* Card Title & Subtitle */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {view === 'signup'
                ? 'Create Account'
                : view === 'forgot-password'
                ? 'Reset Password'
                : 'Welcome Back!'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-2 font-medium">
              {view === 'signup'
                ? 'Start your personalized Kannada learning journey'
                : view === 'forgot-password'
                ? 'Enter your email to receive password reset instructions'
                : 'Continue your Kannada learning journey'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm sm:text-base flex items-start gap-3 animate-in fade-in duration-150"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm sm:text-base flex items-center gap-3 animate-in fade-in duration-150"
              role="status"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: Main 3-Button Screen */}
          {view === 'options' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Button 1: Sign In with Google */}
              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-4 sm:py-4.5 px-6 rounded-full border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-bold text-base sm:text-lg flex items-center justify-center gap-3.5 shadow-xs hover:border-stone-400 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google G Multi-Color SVG */}
                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="relative py-2 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <span className="relative px-4 bg-white text-xs sm:text-sm font-bold text-stone-400 uppercase tracking-widest">
                  OR
                </span>
              </div>

              {/* Button 2: Sign In with Email */}
              <button
                type="button"
                onClick={() => {
                  setView('signin');
                  setErrorMessage(null);
                }}
                className="w-full py-4 sm:py-4.5 px-6 rounded-full border-2 border-red-500 hover:border-red-600 bg-white hover:bg-red-50/70 active:bg-red-100 text-red-600 font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                <span>Sign In with Email</span>
              </button>

              {/* Button 3: Create Account */}
              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  setErrorMessage(null);
                }}
                className="w-full py-4 sm:py-4.5 px-6 rounded-full bg-[#F5B536] hover:bg-[#EAA524] active:bg-amber-600 text-stone-900 font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-stone-900" />
                <span>Create Account</span>
              </button>

              {/* Bottom Forgot Password link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot-password');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setIsResetSent(false);
                  }}
                  className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-red-700 hover:underline cursor-pointer transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: Email Sign In Form */}
          {view === 'signin' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="flex items-center justify-between pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('options');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Back to options</span>
                </button>
                <span className="text-xs sm:text-sm font-extrabold uppercase px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  Email Login
                </span>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 sm:py-4 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot-password');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setIsResetSent(false);
                    }}
                    className="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="At least 6 characters"
                    className="w-full pl-12 pr-12 py-3.5 sm:py-4 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 inline-flex items-center justify-center gap-3 py-4 sm:py-4.5 px-6 rounded-full border-2 border-red-500 bg-white hover:bg-red-50 text-red-600 font-bold text-base sm:text-lg shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    setErrorMessage(null);
                  }}
                  className="text-sm sm:text-base font-semibold text-stone-600 hover:text-red-700 cursor-pointer"
                >
                  Don't have an account? <span className="underline font-bold text-red-700">Create one</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: Account Creation Form */}
          {view === 'signup' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('options');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Back to options</span>
                </button>
                <span className="text-xs sm:text-sm font-extrabold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  New Account
                </span>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className="w-full pl-12 pr-12 py-3 sm:py-3.5 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3 sm:py-3.5 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 inline-flex items-center justify-center gap-3 py-4 sm:py-4.5 px-6 rounded-full bg-[#F5B536] hover:bg-[#EAA524] text-stone-900 font-bold text-base sm:text-lg shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-stone-900" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('signin');
                    setErrorMessage(null);
                  }}
                  className="text-sm sm:text-base font-semibold text-stone-600 hover:text-red-700 cursor-pointer"
                >
                  Already have an account? <span className="underline font-bold text-red-700">Sign in</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: Forgot Password / Password Reset Form */}
          {view === 'forgot-password' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-xs sm:text-sm font-extrabold uppercase px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  Password Reset
                </span>
              </div>

              {isResetSent ? (
                <div className="space-y-5 py-1">
                  <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-stone-700 text-sm sm:text-base leading-relaxed space-y-3">
                    <p className="font-bold text-stone-900 text-base sm:text-lg">
                      We've dispatched a password reset link to:
                    </p>
                    <p className="font-mono text-sm sm:text-base text-red-700 bg-white/95 p-3 rounded-xl border border-amber-200 break-all font-bold select-all">
                      {email}
                    </p>
                    <div className="space-y-2 text-stone-700 text-xs sm:text-sm">
                      <p>
                        • <strong>Check your Spam or Junk folder:</strong> Gmail often marks automated Firebase emails from <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-semibold">noreply@kannada-mitra.firebaseapp.com</code> as spam.
                      </p>
                      <p>
                        • <strong>Search Gmail:</strong> Try searching <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-semibold">in:anywhere kannada-mitra</code> in your Gmail search bar.
                      </p>
                      <p>
                        • <strong>Account required:</strong> For security, Firebase only delivers reset emails if this address is already registered in your Firebase project. If you haven't created an account yet, use <strong>Create Account</strong> below.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={handleResetPasswordSubmit}
                      disabled={isLoading}
                      className="w-full py-3.5 sm:py-4 px-6 rounded-full border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-bold text-sm sm:text-base transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2.5 shadow-xs"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
                          <span>Resending link...</span>
                        </>
                      ) : (
                        <span>Resend Reset Link</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setView('signup');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-[#F5B536] hover:bg-[#EAA524] text-stone-900 font-bold text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-xs"
                    >
                      <UserPlus className="w-5 h-5 text-stone-900" />
                      <span>Not registered? Create Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setView('signin');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                  <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                    Enter your account's email address below and we'll send you instructions to reset your password.
                  </p>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 sm:py-4 text-base sm:text-lg bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 inline-flex items-center justify-center gap-3 py-4 sm:py-4.5 px-6 rounded-full border-2 border-red-500 bg-white hover:bg-red-50 text-red-600 font-bold text-base sm:text-lg shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-3 space-y-2.5">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setView('signin');
                          setErrorMessage(null);
                        }}
                        className="text-sm sm:text-base font-semibold text-stone-600 hover:text-red-700 cursor-pointer"
                      >
                        Remember your password? <span className="underline font-bold text-red-700">Sign in</span>
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setView('signup');
                          setErrorMessage(null);
                        }}
                        className="text-sm sm:text-base font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Don't have an account? <span className="underline font-bold text-amber-700">Create one</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Firebase Configuration Setup notice */}
          {!configured && (
            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm text-amber-900 bg-amber-50/80 px-4 py-3 rounded-2xl border border-amber-200">
              <span className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Firebase Auth requires setup
              </span>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="font-bold text-red-700 underline cursor-pointer hover:text-red-800"
              >
                Setup Guide
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Setup Guide Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-amber-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  Firebase Authentication Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Kannada Mitra connects with <strong>Firebase Authentication</strong> (Email/Password + Google Sign-In) and <strong>Cloud Firestore</strong>.
            </p>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-stone-800 uppercase tracking-wider block">
                Required Environment Variables in .env:
              </span>
              <div className="bg-stone-900 text-stone-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                <div>VITE_FIREBASE_API_KEY=your_api_key</div>
                <div>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</div>
                <div>VITE_FIREBASE_PROJECT_ID=your_project_id</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</div>
                <div>VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</div>
                <div>VITE_FIREBASE_APP_ID=your_app_id</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <span className="font-bold block">Steps in Firebase Console:</span>
              <ol className="list-decimal list-inside space-y-1 text-stone-700">
                <li>Create project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-red-700 underline inline-flex items-center gap-0.5">console.firebase.google.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Enable <strong>Authentication &gt; Sign-in method</strong>: Email/Password and Google.</li>
                <li>Enable <strong>Cloud Firestore</strong>.</li>
                <li>Register a Web app (&lt;/&gt;) and copy credentials into <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code>.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Close Setup Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
