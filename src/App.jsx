import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import DashboardView from './components/DashboardView';
import FloatingChatbot from './components/FloatingChatbot';
import './index.css';

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(145deg, #f7f9f7 0%, #fbf9f5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0d7b5f',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.15rem',
                fontWeight: '700'
            }}>
                <div style={{ 
                    textAlign: 'center',
                    background: '#ffffff',
                    padding: '2.5rem 3rem',
                    borderRadius: '24px',
                    border: '1px solid #e2ece4',
                    boxShadow: '0 12px 32px -4px rgba(19, 46, 39, 0.08)'
                }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 12px rgba(13, 123, 95, 0.2))' }}>💊</div>
                    <div style={{ color: '#132e27', fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>DoseBuddy</div>
                    <span style={{ color: '#526c63', fontSize: '0.95rem', fontWeight: '600' }}>Initializing Medical Companion...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {isAuthenticated ? <DashboardView /> : <AuthPage />}
            <FloatingChatbot />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
