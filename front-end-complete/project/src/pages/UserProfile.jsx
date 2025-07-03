import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, LogOut, Clock, CheckCircle, User, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

function UserProfile() {
  const { state, dispatch, fetchUserProfile } = useApp();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(state.user || {});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Helper to get JWT from localStorage
  const getToken = () => localStorage.getItem('jwt');

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchUserProfile();
        setEditedUser(state.user || {});
      } catch (err) {
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // Keep editedUser in sync with state.user
  useEffect(() => {
    setEditedUser(state.user || {});
  }, [state.user]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/customers/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(editedUser)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      dispatch({
        type: 'LOGIN',
        payload: {
          user: data,
          userType: state.userType
        }
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cooking': return 'bg-blue-100 text-blue-800 ';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'cooking': return <Clock size={16} />;
      case 'ready': return <CheckCircle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-between py-3">
            <div className="d-flex align-items-center">
              <Link 
                to="/main" 
                className="btn btn-link p-2 text-gray-600 text-decoration-none me-3"
                style={{ borderRadius: '0.5rem' }}
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="h3 fw-bold text-gray-900 mb-0">My Profile</h1>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger d-flex align-items-center"
            >
              <LogOut size={20} className="me-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container-fluid py-4">
        <div className="row g-4">
          {/* Profile Section */}
          <div className="col-lg-6">
            <div className="bg-white rounded-xl shadow-custom p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="h4 fw-bold text-gray-900 d-flex align-items-center mb-0">
                  <User className="text-orange-500 me-2" size={24} />
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-link p-2 text-orange-500 text-decoration-none"
                    title="Edit Profile"
                    style={{ borderRadius: '0.5rem' }}
                  >
                    <Edit2 size={20} />
                  </button>
                )}
              </div>

              {error && (
                <div className="alert alert-danger text-center" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success text-center" role="alert">
                  {success}
                </div>
              )}
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border text-orange-500" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="position-relative">
                      <User className="position-absolute text-gray-400" size={20} style={{ left: '12px', top: '12px', zIndex: 5 }} />
                      <input
                        type="text"
                        className="form-control ps-5"
                        value={editedUser.name || ''}
                        onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="position-relative">
                      <Mail className="position-absolute text-gray-400" size={20} style={{ left: '12px', top: '12px', zIndex: 5 }} />
                      <input
                        type="email"
                        className="form-control ps-5"
                        value={editedUser.email || ''}
                        onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="position-relative">
                      <Phone className="position-absolute text-gray-400" size={20} style={{ left: '12px', top: '12px', zIndex: 5 }} />
                      <input
                        type="tel"
                        className="form-control ps-5"
                        value={editedUser.phoneNumber || ''}
                        onChange={(e) => setEditedUser({...editedUser, phoneNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Address
                    </label>
                    <div className="position-relative">
                      <MapPin className="position-absolute text-gray-400" size={20} style={{ left: '12px', top: '12px', zIndex: 5 }} />
                      <textarea
                        rows="3"
                        className="form-control ps-5 resize-none"
                        value={editedUser.address || ''}
                        onChange={(e) => setEditedUser({...editedUser, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 pt-3">
                    <button
                      onClick={handleSaveProfile}
                      className="btn btn-orange flex-fill"
                      disabled={loading}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedUser(state.user || {});
                      }}
                      className="btn btn-secondary flex-fill"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="d-flex align-items-center p-3 bg-gray-50 rounded">
                    <User size={20} className="text-gray-400 me-3" />
                    <div>
                      <p className="small text-gray-600 mb-0">Full Name</p>
                      <p className="fw-medium text-gray-900 mb-0">{state.user?.name || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center p-3 bg-gray-50 rounded">
                    <Mail size={20} className="text-gray-400 me-3" />
                    <div>
                      <p className="small text-gray-600 mb-0">Email Address</p>
                      <p className="fw-medium text-gray-900 mb-0">{state.user?.email || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center p-3 bg-gray-50 rounded">
                    <Phone size={20} className="text-gray-400 me-3" />
                    <div>
                      <p className="small text-gray-600 mb-0">Phone Number</p>
                      <p className="fw-medium text-gray-900 mb-0">{state.user?.phoneNumber || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start p-3 bg-gray-50 rounded">
                    <MapPin size={20} className="text-gray-400 me-3 mt-1" />
                    <div>
                      <p className="small text-gray-600 mb-0">Address</p>
                      <p className="fw-medium text-gray-900 mb-0">{state.user?.address || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="col-lg-6">
            <div className="bg-white rounded-xl shadow-custom p-4">
              <h2 className="h4 fw-bold text-gray-900 mb-4">Order History</h2>
              
              {state.orders.length === 0 ? (
                <div className="text-center py-4">
                  <Clock size={48} className="text-gray-300 mx-auto mb-3" />
                  <h6 className="fw-semibold text-gray-700 mb-2">No orders yet</h6>
                  <p className="text-gray-500 mb-3">Your order history will appear here</p>
                  <Link
                    to="/main"
                    className="btn btn-orange d-inline-flex align-items-center"
                  >
                    Start Ordering
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {state.orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded p-3 cursor-pointer transition-all"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-semibold text-gray-900 mb-1">Order #{order.id.slice(-6)}</h6>
                          <p className="text-gray-600 small mb-0">{order.restaurant?.name}</p>
                        </div>
                        <div className="text-end">
                          <span className={`badge d-inline-flex align-items-center ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ms-1 text-capitalize">{order.status}</span>
                          </span>
                          <p className="fw-semibold text-green-600 mt-1 mb-0">₹{order.total}</p>
                        </div>
                      </div>
                      
                      {selectedOrder?.id === order.id && (
                        <div className="mt-3 pt-3 border-top border-gray-200">
                          <h6 className="fw-medium text-gray-900 mb-2">Order Summary:</h6>
                          <ul className="space-y-1 small text-gray-600 mb-3 ps-3">
                            {order.items.map((item, index) => (
                              <li key={index} className="d-flex justify-content-between">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="small text-gray-500">
                            <p className="mb-1">Ordered: {new Date(order.timestamp).toLocaleString()}</p>
                            <p className="mb-0">Payment: Completed</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;