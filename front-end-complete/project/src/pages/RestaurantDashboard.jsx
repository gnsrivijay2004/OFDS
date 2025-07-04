import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Clock, ChefHat, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/Header.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import FormInput from '../components/FormInput.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import MenuItemCard from '../components/MenuItemCard.jsx';

function RestaurantDashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dietFilter, setDietFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [newItem, setNewItem] = useState({
    name: '',
    isVeg: 'yes',
    price: '',
    description: ''
  });
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get JWT from localStorage
  const getToken = () => localStorage.getItem('jwt');

  const restaurantId = state.user?.id;

  // Fetch menu and orders on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch menu
        const menuRes = await fetch(`/api/menu/restaurant/${restaurantId}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        const menuData = await menuRes.json();
        setMenu(menuData);
        // Fetch orders
        const ordersRes = await fetch('/api/orders/restaurant', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (restaurantId) fetchData();
  }, [restaurantId]);

  // Filter menu items based on diet preference
  const filteredMenu = menu.filter(item => {
    if (dietFilter === 'veg') return item.isVeg;
    if (dietFilter === 'non-veg') return !item.isVeg;
    return true; // 'all'
  });

  const vegCount = menu.filter(item => item.isVeg).length;
  const nonVegCount = menu.filter(item => !item.isVeg).length;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  // Add menu item
  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const requestBody = {
        ...newItem,
        price: parseInt(newItem.price),
        isVeg: newItem.isVeg === 'yes',
        restaurantId
      };
      
      console.log('Adding menu item:', requestBody);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Restaurant ID:', restaurantId);
      
      const res = await fetch('/api/menu/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to add menu item: ${res.status} ${errorText}`);
      }
      
      const added = await res.json();
      console.log('Added item:', added);
      setMenu(prev => [...prev, added]);
      setNewItem({ name: '', isVeg: 'yes', price: '', description: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit menu item
  const handleEditItem = (item) => {
    setEditingItem({
      ...item,
      isVeg: item.isVeg ? 'yes' : 'no'
    });
  };

  // Update menu item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...editingItem,
          price: parseInt(editingItem.price),
          isVeg: editingItem.isVeg === 'yes',
          restaurantId
        })
      });
      if (!res.ok) throw new Error('Failed to update menu item');
      const updated = await res.json();
      setMenu(prev => prev.map(item => item.id === updated.id ? updated : item));
      setEditingItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete menu item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to delete menu item');
      setMenu(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update order status');
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, setState) => {
    setState(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Find current restaurant info for header
  const currentRestaurant = { name: state.user?.name, location: state.user?.location };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-bottom">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <ChefHat className="text-green-500 me-3" size={32} />
              <div>
                <h1 className="h3 fw-bold text-gray-900 mb-0">{currentRestaurant.name}</h1>
                <p className="text-gray-600 mb-0">{currentRestaurant.location}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="danger"
              icon={LogOut}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container-fluid py-4">
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-center py-2">
            <div className="spinner-border text-green-500" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        <div className="row g-4">
          {/* Orders Section */}
          <div className="col-lg-6">
            <div className="bg-white rounded-xl shadow-custom p-4">
              <h2 className="h4 fw-bold text-gray-900 mb-4 d-flex align-items-center">
                <Clock className="text-primary me-2" size={24} />
                Active Orders
              </h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-semibold text-gray-900 mb-1">Order #{order.id}</h6>
                        <p className="text-gray-600 mb-0">{order.customerName || order.customer?.name}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mb-3">
                      <p className="small text-gray-600 mb-1">Items:</p>
                      <ul className="small text-gray-800 mb-0 ps-3">
                        {order.items.map((item, index) => (
                          <li key={index}>• {item.name || item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold text-green-600">₹{order.total}</span>
                      <select 
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accept</option>
                        <option value="cooking">In Cooking</option>
                        <option value="ready">Ready</option>
                        <option value="out-for-delivery">Out for Delivery</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Section */}
          <div className="col-lg-6">
            <div className="bg-white rounded-xl shadow-custom p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 fw-bold text-gray-900 d-flex align-items-center mb-0">
                  <ChefHat className="text-green-500 me-2" size={24} />
                  Menu Items
                </h2>
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="primary"
                  icon={Plus}
                >
                  Add Item
                </Button>
              </div>
              {/* Diet Filter */}
              <div className="d-flex align-items-center mb-3">
                <Filter size={20} className="text-gray-500 me-2" />
                <div className="btn-group" role="group">
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="dietFilter" 
                    id="all" 
                    checked={dietFilter === 'all'}
                    onChange={() => setDietFilter('all')}
                  />
                  <label className="btn btn-outline-secondary btn-sm" htmlFor="all">
                    All ({menu.length})
                  </label>
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="dietFilter" 
                    id="veg" 
                    checked={dietFilter === 'veg'}
                    onChange={() => setDietFilter('veg')}
                  />
                  <label className="btn btn-outline-success btn-sm d-flex align-items-center" htmlFor="veg">
                    <span className="bg-success rounded-circle me-1" style={{ width: '12px', height: '12px' }}></span>
                    Veg ({vegCount})
                  </label>
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="dietFilter" 
                    id="non-veg" 
                    checked={dietFilter === 'non-veg'}
                    onChange={() => setDietFilter('non-veg')}
                  />
                  <label className="btn btn-outline-danger btn-sm d-flex align-items-center" htmlFor="non-veg">
                    <span className="bg-danger rounded-circle me-1" style={{ width: '12px', height: '12px' }}></span>
                    Non-Veg ({nonVegCount})
                  </label>
                </div>
              </div>
              {/* Menu List */}
              <div className="row g-3">
                {filteredMenu.map((item) => (
                  <div key={item.id} className="col-12">
                    <MenuItemCard
                      item={item}
                      onEdit={() => handleEditItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Add/Edit Modal */}
        <Modal show={showAddForm || editingItem} onClose={() => { setShowAddForm(false); setEditingItem(null); }}>
          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
            <h5 className="fw-bold mb-3">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h5>
            <FormInput
              label="Name"
              name="name"
              value={editingItem ? editingItem.name : newItem.name}
              onChange={e => handleInputChange(e, editingItem ? setEditingItem : setNewItem)}
              required
            />
            <FormInput
              label="Description"
              name="description"
              value={editingItem ? editingItem.description : newItem.description}
              onChange={e => handleInputChange(e, editingItem ? setEditingItem : setNewItem)}
              required
            />
            <FormInput
              label="Price"
              name="price"
              type="number"
              value={editingItem ? editingItem.price : newItem.price}
              onChange={e => handleInputChange(e, editingItem ? setEditingItem : setNewItem)}
              required
            />
            <div className="mb-3">
              <label className="form-label fw-medium text-gray-700">Type</label>
              <select
                className="form-select"
                name="isVeg"
                value={editingItem ? editingItem.isVeg : newItem.isVeg}
                onChange={e => handleInputChange(e, editingItem ? setEditingItem : setNewItem)}
                required
              >
                <option value="yes">Vegetarian</option>
                <option value="no">Non-Vegetarian</option>
              </select>
            </div>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {editingItem ? 'Update' : 'Add'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setEditingItem(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

export default RestaurantDashboard;