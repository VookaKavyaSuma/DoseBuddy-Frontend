import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();

    if (!user) return null;

    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
    const isCaregiver = user.role === 'CAREGIVER';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Brand Logo */}
                <div className="nav-brand">
                    <div className="nav-logo-icon">💊</div>
                    <div className="nav-brand-text">
                        <span className="nav-title">DoseBuddy</span>
                        <span className="nav-subtitle">MedCompanion System</span>
                    </div>
                </div>

                {/* User Session Info & Logout */}
                <div className="nav-user-section">
                    <div className="user-card">
                        <div className="user-avatar">{initial}</div>
                        <div className="user-details">
                            <span className="user-name">{user.fullName || user.username}</span>
                            <div className="user-badge-row">
                                <span className={`role-badge ${isCaregiver ? 'caregiver' : 'patient'}`}>
                                    {isCaregiver ? '🩺 Caregiver' : '💊 Patient'}
                                </span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <button type="button" className="logout-btn" onClick={logout} title="Sign Out">
                        <span className="logout-icon">🚪</span>
                        <span className="logout-text">Sign Out</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
