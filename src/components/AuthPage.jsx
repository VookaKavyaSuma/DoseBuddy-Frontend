import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
    const { login, register, demoLogin, isLoading, authError, clearError } = useAuth();
    
    // Auth Mode: 'login' or 'register'
    const [mode, setMode] = useState('login');
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('CAREGIVER');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [localError, setLocalError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const switchMode = (newMode) => {
        setMode(newMode);
        setLocalError('');
        setSuccessMessage('');
        clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (mode === 'login') {
            if (!email.trim() || !password) {
                setLocalError('Please fill in both email and password.');
                return;
            }
            try {
                await login(email.trim(), password);
            } catch (err) {
                setLocalError(err.message || 'Login failed. Please check your credentials.');
            }
        } else {
            if (!fullName.trim()) {
                setLocalError('Please enter your full name.');
                return;
            }
            if (!email.trim()) {
                setLocalError('Please enter a valid email address.');
                return;
            }
            if (password.length < 6) {
                setLocalError('Password must be at least 6 characters.');
                return;
            }

            try {
                await register({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password,
                    role: role
                });
                setSuccessMessage('Account created! Welcome to DoseBuddy.');
            } catch (err) {
                setLocalError(err.message || 'Registration failed. Try a different email.');
            }
        }
    };

    const handleDemoLogin = async (selectedRole) => {
        setLocalError('');
        try {
            await demoLogin(selectedRole);
        } catch (err) {
            setLocalError('Demo login error: ' + err.message);
        }
    };

    const displayError = localError || authError;

    return (
        <div className="auth-container">
            {/* Background decorative glow elements */}
            <div className="ambient-glow glow-teal"></div>
            <div className="ambient-glow glow-blue"></div>
            <div className="ambient-glow glow-emerald"></div>

            <div className="auth-wrapper">
                {/* Left Brand Showcase Section */}
                <div className="auth-brand-card">
                    <div className="brand-header">
                        <div className="brand-logo-pill">
                            <span className="pill-icon">💊</span>
                            <span className="heart-badge">❤️</span>
                        </div>
                        <h1 className="brand-title">DoseBuddy</h1>
                        <p className="brand-tagline">MedCompanion Smart Medication & Caregiver System</p>
                    </div>

                    <div className="brand-features">
                        <div className="feature-item">
                            <div className="feature-icon">📸</div>
                            <div className="feature-text">
                                <h3>Visual Pill Verification</h3>
                                <p>Caregivers upload clear photos and custom instructions so patients take the exact right dose.</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">⏰</div>
                            <div className="feature-text">
                                <h3>Smart Alerts & Reminders</h3>
                                <p>Timely alerts show pill pictures, exact reasons, and doses to avoid missed or double doses.</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon">📦</div>
                            <div className="feature-text">
                                <h3>Automated Refill Inventory</h3>
                                <p>Track dose counts automatically and separate active medicines from completed prescriptions.</p>
                            </div>
                        </div>
                    </div>

                    <div className="brand-footer">
                        <div className="security-badge">
                            <span className="lock-icon">🔒</span>
                            <span>Secure Spring Boot JWT Auth • 100% Data Accuracy</span>
                        </div>
                    </div>
                </div>

                {/* Right Form Card Section */}
                <div className="auth-form-card">
                    <div className="auth-header">
                        <h2>{mode === 'login' ? 'Welcome Back 👋' : 'Create Account 🚀'}</h2>
                        <p>{mode === 'login' ? 'Sign in to manage medications and care schedules' : 'Join DoseBuddy as a Caregiver or Patient'}</p>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="tab-switcher">
                        <button
                            type="button"
                            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => switchMode('register')}
                        >
                            Register
                        </button>
                    </div>

                    {/* Quick Demo Login Banner */}
                    <div className="demo-login-box">
                        <span className="demo-label">⚡ Quick One-Click Demo:</span>
                        <div className="demo-btn-group">
                            <button
                                type="button"
                                className="demo-chip caregiver"
                                onClick={() => handleDemoLogin('CAREGIVER')}
                                disabled={isLoading}
                            >
                                👩‍⚕️ Caregiver Mode
                            </button>
                            <button
                                type="button"
                                className="demo-chip patient"
                                onClick={() => handleDemoLogin('PATIENT')}
                                disabled={isLoading}
                            >
                                👨‍🦳 Patient Mode
                            </button>
                        </div>
                    </div>

                    <div className="divider">
                        <span>or with email</span>
                    </div>

                    {/* Notification Banners */}
                    {displayError && (
                        <div className="alert-box error">
                            <span className="alert-icon">⚠️</span>
                            <span>{displayError}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert-box success">
                            <span className="alert-icon">✅</span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">👤</span>
                                        <input
                                            id="fullName"
                                            type="text"
                                            placeholder="e.g. Sarah Jenkins"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required={mode === 'register'}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>I am registering as a:</label>
                                    <div className="role-selector">
                                        <label className={`role-card ${role === 'CAREGIVER' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="CAREGIVER"
                                                checked={role === 'CAREGIVER'}
                                                onChange={() => setRole('CAREGIVER')}
                                            />
                                            <span className="role-emoji">🩺</span>
                                            <div className="role-info">
                                                <span className="role-name">Caregiver</span>
                                                <span className="role-desc">Manages pills & reminders</span>
                                            </div>
                                        </label>

                                        <label className={`role-card ${role === 'PATIENT' ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="PATIENT"
                                                checked={role === 'PATIENT'}
                                                onChange={() => setRole('PATIENT')}
                                            />
                                            <span className="role-emoji">💊</span>
                                            <div className="role-info">
                                                <span className="role-name">Patient</span>
                                                <span className="role-desc">Views doses & logs intake</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email Address or Username</label>
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    id="email"
                                    type="text"
                                    placeholder={mode === 'login' ? 'caregiver@dosebuddy.com' : 'name@example.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password">Password</label>
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        className="forgot-link"
                                        onClick={() => alert('Demo Reset: You can use any demo account or register a new one!')}
                                    >
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="input-wrapper">
                                <span className="input-icon">🔑</span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '👁️' : '🙈'}
                                </button>
                            </div>
                        </div>

                        {mode === 'login' && (
                            <div className="remember-me-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember me on this device</span>
                                </label>
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? (
                                <span className="spinner-loader">⏳ Authenticating...</span>
                            ) : (
                                <span>{mode === 'login' ? 'Sign In to DoseBuddy ➔' : 'Create Account ➔'}</span>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer-note">
                        {mode === 'login' ? (
                            <p>Don't have an account? <button type="button" className="inline-link" onClick={() => switchMode('register')}>Sign up now</button></p>
                        ) : (
                            <p>Already have an account? <button type="button" className="inline-link" onClick={() => switchMode('login')}>Sign in</button></p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
