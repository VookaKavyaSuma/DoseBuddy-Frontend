import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    fetchMedicationsApi, 
    createMedicationApi, 
    takeMedicationDoseApi, 
    deleteMedicationApi 
} from '../services/api';
import Navbar from './Navbar';
import './DashboardView.css';

export default function DashboardView() {
    const { user, token } = useAuth();
    const isCaregiver = user?.role === 'CAREGIVER';

    const [activeTab, setActiveTab] = useState('current');
    const [showAddModal, setShowAddModal] = useState(false);
    const [medications, setMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields for adding new medication
    const [newName, setNewName] = useState('');
    const [newDosage, setNewDosage] = useState('');
    const [newReason, setNewReason] = useState('');
    const [newDays, setNewDays] = useState(30);
    const [newSchedule, setNewSchedule] = useState('Today at 8:00 PM');
    const [newNote, setNewNote] = useState('');

    // Fetch medications from backend API (connected to MySQL database)
    const loadMedications = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const data = await fetchMedicationsApi();
            if (Array.isArray(data)) {
                setMedications(data);
            }
        } catch (err) {
            console.error('Failed to load medications from database:', err);
            setLoadError('Unable to load prescriptions from database. Make sure your server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMedications();
    }, [token]);

    const handleCreateMedication = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            alert('Please enter a medication name.');
            return;
        }

        setIsSaving(true);
        const medPayload = {
            name: newName.trim(),
            dosage: newDosage.trim() || '1 Tablet Daily',
            reason: newReason.trim() || 'General health prescription',
            photo: '💊',
            category: 'current',
            totalDays: parseInt(newDays) || 30,
            remainingDoses: parseInt(newDays) || 30,
            nextDose: newSchedule.trim() || 'Today at 8:00 PM',
            caregiverNote: newNote.trim() || 'Take as instructed by healthcare provider.',
            userId: user?.id || 'usr_caregiver_1'
        };

        try {
            const saved = await createMedicationApi(medPayload);
            setMedications(prev => [saved, ...prev]);
            setShowAddModal(false);
            // Reset form
            setNewName('');
            setNewDosage('');
            setNewReason('');
            setNewDays(30);
            setNewSchedule('Today at 8:00 PM');
            setNewNote('');
        } catch (err) {
            console.error('Error saving medication to database:', err);
            alert('Failed to save medication to database: ' + (err.message || 'Please check connection.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTakeDose = async (id) => {
        try {
            const updated = await takeMedicationDoseApi(id);
            setMedications(prev => prev.map(m => m.id === id ? updated : m));
        } catch (err) {
            console.error('Error recording taken dose in database:', err);
            alert('Failed to update dose in database. Please check your connection.');
        }
    };

    const handleDeleteMedication = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}" from the database?`)) {
            return;
        }
        try {
            await deleteMedicationApi(id);
            setMedications(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Failed to delete medication from database:', err);
            alert('Failed to delete medication from database.');
        }
    };

    const activeMeds = medications.filter(m => m.category === 'current');
    const pastMeds = medications.filter(m => m.category === 'past');
    const displayedMeds = activeTab === 'current' ? activeMeds : pastMeds;

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

                    {loadError && (
                        <div className="meds-error-banner">
                            <span>⚠️ {loadError}</span>
                            <button onClick={loadMedications} className="retry-btn">Retry</button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="meds-empty-state">
                            <div className="meds-spinner"></div>
                            <p>Loading prescriptions from database...</p>
                        </div>
                    ) : displayedMeds.length === 0 ? (
                        <div className="meds-empty-state">
                            <div className="empty-icon">{activeTab === 'current' ? '💊' : '📁'}</div>
                            <h3>{activeTab === 'current' ? 'No Active Prescriptions in Database' : 'No Past Prescriptions in Database'}</h3>
                            <p>
                                {activeTab === 'current'
                                    ? (isCaregiver 
                                        ? 'No active medications are stored in your database yet. Click "➕ Add New Medication" above to add one.'
                                        : 'No active prescriptions assigned yet. Your caregiver can add prescriptions for you.')
                                    : 'No completed or archived prescriptions found in the database.'}
                            </p>
                        </div>
                    ) : (
                        <div className="meds-grid">
                            {displayedMeds.map(med => (
                                <div className="med-card" key={med.id}>
                                    <div className="med-card-header">
                                        <div className="med-icon-box">{med.photo || '💊'}</div>
                                        <div className="med-title-group">
                                            <h3>{med.name}</h3>
                                            <span className="med-reason">{med.reason}</span>
                                        </div>
                                        {isCaregiver && (
                                            <button 
                                                className="delete-med-btn" 
                                                title="Delete medication from database"
                                                onClick={() => handleDeleteMedication(med.id, med.name)}
                                            >
                                                🗑️
                                            </button>
                                        )}
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
                                            <span className="detail-value note">"{med.caregiverNote || 'Take with water'}"</span>
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
                                                style={{ width: `${Math.min(100, (med.remainingDoses / (med.totalDays || 30)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        {med.remainingDoses <= 5 && med.category === 'current' && (
                                            <div className="refill-warning">
                                                ⚠️ Low Stock Alert: Refill Needed Soon!
                                            </div>
                                        )}

                                        {med.category === 'current' && (
                                            <button
                                                className="take-dose-btn"
                                                onClick={() => handleTakeDose(med.id)}
                                            >
                                                ✅ Log Dose Taken (-1)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Medication Modal for Caregivers */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📸 Add New Medication (Caregiver Entry)</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateMedication} className="modal-body">
                            <p>Manual Caregiver Pill Entry for 100% Accuracy & MySQL Inventory Tracking.</p>
                            <div className="modal-form-group">
                                <label>Medicine Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lisinopril"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Dosage Instructions</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 10mg - 1 Tablet Daily"
                                    value={newDosage}
                                    onChange={e => setNewDosage(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Simple Reason (e.g. "for blood pressure")</label>
                                <input
                                    type="text"
                                    placeholder="e.g. For Blood Pressure Control"
                                    value={newReason}
                                    onChange={e => setNewReason(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Total Days Duration</label>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="30"
                                    value={newDays}
                                    onChange={e => setNewDays(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Next Scheduled Time</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Today at 8:00 PM"
                                    value={newSchedule}
                                    onChange={e => setNewSchedule(e.target.value)}
                                />
                            </div>
                            <div className="modal-form-group">
                                <label>Caregiver Special Instructions</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Take with water after breakfast."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="modal-submit-btn"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving to Database...' : 'Save Medication to MySQL'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
