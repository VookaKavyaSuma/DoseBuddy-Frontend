import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import './DashboardView.css';

export default function DashboardView() {
    const { user, token } = useAuth();
    const isCaregiver = user?.role === 'CAREGIVER';

    // State for tabs: 'current' or 'past'
    const [activeTab, setActiveTab] = useState('current');
    const [showAddModal, setShowAddModal] = useState(false);

    // Initial mock medication items according to MedCompanion spec
    const [medications, setMedications] = useState([
        {
            id: 1,
            name: 'Amlodipine Besylate',
            dosage: '5mg - 1 Tablet Daily',
            reason: 'For Blood Pressure Control',
            photo: '💊',
            category: 'current',
            remainingDoses: 18,
            totalDays: 30,
            nextDose: 'Today at 8:00 PM',
            caregiverNote: 'Take with full glass of water after dinner.'
        },
        {
            id: 2,
            name: 'Metformin HC1',
            dosage: '500mg - 2 Tablets Daily',
            reason: 'For Blood Sugar Regulation',
            photo: '💊',
            category: 'current',
            remainingDoses: 4, // Low inventory warning
            totalDays: 60,
            nextDose: 'Tomorrow at 8:00 AM',
            caregiverNote: 'Take with breakfast.'
        },
        {
            id: 3,
            name: 'Amoxicillin Antibiotic',
            dosage: '250mg - 3 Times Daily',
            reason: 'For Throat Infection',
            photo: '💊',
            category: 'past',
            remainingDoses: 0,
            totalDays: 10,
            nextDose: 'Course Completed',
            caregiverNote: 'Full 10-day prescription finished.'
        }
    ]);

    const activeMeds = medications.filter(m => m.category === 'current');
    const pastMeds = medications.filter(m => m.category === 'past');

    return (
        <div className="dashboard-page">
            <Navbar />

            <main className="dashboard-content">
                {/* Auth Welcome Banner */}
                <div className="welcome-banner">
                    <div className="banner-left">
                        <span className="auth-status-chip">
                            <span className="pulse-dot"></span> JWT Session Active
                        </span>
                        <h1>Welcome back, {user?.fullName || 'Caregiver'}!</h1>
                        <p>
                            {isCaregiver 
                                ? 'You are logged in as a Caregiver. You can add medicines, set photo instructions, and monitor patient adherence.'
                                : 'You are logged in as a Patient. View your exact pill photos, dosage reasons, and upcoming alerts.'}
                        </p>
                    </div>

                    {isCaregiver && (
                        <button className="add-med-btn" onClick={() => setShowAddModal(true)}>
                            <span>➕ Add New Medication</span>
                        </button>
                    )}
                </div>

                {/* Session Details Card */}
                <div className="session-info-card">
                    <div className="session-item">
                        <span className="session-label">User ID:</span>
                        <code className="session-code">{user?.id}</code>
                    </div>
                    <div className="session-item">
                        <span className="session-label">Email:</span>
                        <span className="session-val">{user?.email}</span>
                    </div>
                    <div className="session-item">
                        <span className="session-label">Access Role:</span>
                        <span className="session-val highlight">{user?.role}</span>
                    </div>
                    <div className="session-item">
                        <span className="session-label">Token Snippet:</span>
                        <code className="session-code token">{token ? `${token.substring(0, 18)}...` : 'None'}</code>
                    </div>
                </div>

                {/* Medication Folders Section */}
                <div className="meds-container">
                    <div className="meds-header">
                        <div className="folder-tabs">
                            <button
                                className={`folder-tab ${activeTab === 'current' ? 'active' : ''}`}
                                onClick={() => setActiveTab('current')}
                            >
                                🟢 Current Active Prescriptions ({activeMeds.length})
                            </button>
                            <button
                                className={`folder-tab ${activeTab === 'past' ? 'active' : ''}`}
                                onClick={() => setActiveTab('past')}
                            >
                                📁 Past Completed Prescriptions ({pastMeds.length})
                            </button>
                        </div>
                    </div>

                    <div className="meds-grid">
                        {(activeTab === 'current' ? activeMeds : pastMeds).map(med => (
                            <div className="med-card" key={med.id}>
                                <div className="med-card-header">
                                    <div className="med-icon-box">{med.photo}</div>
                                    <div className="med-title-group">
                                        <h3>{med.name}</h3>
                                        <span className="med-reason">{med.reason}</span>
                                    </div>
                                </div>

                                <div className="med-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Exact Dosage:</span>
                                        <span className="detail-value">{med.dosage}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Next Schedule:</span>
                                        <span className="detail-value schedule">{med.nextDose}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Caregiver Note:</span>
                                        <span className="detail-value note">"{med.caregiverNote}"</span>
                                    </div>
                                </div>

                                <div className="med-inventory-bar">
                                    <div className="inventory-info">
                                        <span>Inventory Remaining</span>
                                        <span className={`inventory-count ${med.remainingDoses <= 5 ? 'low' : ''}`}>
                                            {med.remainingDoses} doses left
                                        </span>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className={`progress-fill ${med.remainingDoses <= 5 ? 'low' : ''}`}
                                            style={{ width: `${Math.min(100, (med.remainingDoses / med.totalDays) * 100)}%` }}
                                        ></div>
                                    </div>
                                    {med.remainingDoses <= 5 && med.category === 'current' && (
                                        <div className="refill-warning">
                                            ⚠️ Low Stock Alert: Refill Needed Soon!
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Quick Add Medication Modal for Caregivers */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📸 Add New Medication (Caregiver Entry)</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Manual Caregiver Pill Entry for 100% Accuracy & Inventory Tracking.</p>
                            <div className="modal-form-group">
                                <label>Medicine Name</label>
                                <input type="text" placeholder="e.g. Lisinopril" defaultValue="" />
                            </div>
                            <div className="modal-form-group">
                                <label>Simple Reason (e.g. "for blood pressure")</label>
                                <input type="text" placeholder="e.g. For Blood Pressure" defaultValue="" />
                            </div>
                            <div className="modal-form-group">
                                <label>Total Days Duration</label>
                                <input type="number" placeholder="30" defaultValue="30" />
                            </div>
                            <button
                                className="modal-submit-btn"
                                onClick={() => {
                                    alert('Medication logged with secure caregiver verification!');
                                    setShowAddModal(false);
                                }}
                            >
                                Save Medication Prescripton
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
