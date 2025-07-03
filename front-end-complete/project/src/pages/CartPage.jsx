import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

function CartPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(state.user?.address || '');

  const handleAddToCart = (item) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { item, restaurant: state.cartRestaurant }
    });
  };

  const handleRemoveFromCart = (item) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: { id: item.id }
    });
  };

  const subtotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 200 ? 0 : 30;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  // Helper to get JWT from localStorage
  const getToken = () => localStorage.getItem('jwt');

  const handlePlaceOrder = async () => {
    if (state.cart.length === 0) return;
    if (!deliveryAddress) {
      setError('Please enter a delivery address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey = uuidv4();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          restaurantId: state.cartRestaurant.id,
          deliveryAddress,
        })
      });
      if (!res.ok) throw new Error('Failed to place order');
      const data = await res.json();
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'ADD_ORDER', payload: data });
      navigate('/payment', { state: { order: data } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container-fluid">
            <div className="d-flex align-items-center py-3">
              <Link 
                to="/main" 
                className="btn btn-link p-2 text-gray-600 text-decoration-none me-3"
                style={{ borderRadius: '0.5rem' }}
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="h3 fw-bold text-gray-900 mb-0">Your Cart</h1>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="container-fluid py-5">
          <div className="text-center">
            <div className="text-gray-300 mb-4">
              <ShoppingCart size={96} className="mx-auto" />
            </div>
            <h2 className="h3 fw-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
            <Link
              to="/main"
              className="btn btn-orange d-inline-flex align-items-center"
            >
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center py-3">
            <Link 
              to="/main" 
              className="btn btn-link p-2 text-gray-600 text-decoration-none me-3"
              style={{ borderRadius: '0.5rem' }}
            >
              <ArrowLeft size={24} />
            </Link>
            <h1 className="h3 fw-bold text-gray-900 mb-0">Your Cart</h1>
          </div>
        </div>
      </header>

      <div className="container-fluid py-4">
        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            {/* Restaurant Info */}
            {state.cartRestaurant && (
              <div className="bg-white rounded-xl shadow-custom p-4 mb-4">
                <h2 className="h5 fw-bold text-gray-900 mb-2">
                  Ordering from {state.cartRestaurant.name}
                </h2>
                <p className="text-gray-600 mb-0">{state.cartRestaurant.location}</p>
              </div>
            )}

            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-custom p-4">
              <h3 className="h5 fw-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-4">
                {state.cart.map((item) => (
                  <div key={item.id} className="d-flex align-items-center justify-content-between py-3 border-bottom">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="fw-semibold text-gray-900 mb-0">{item.name}</h6>
                        <span className={`badge ${
                          item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isVeg ? '🟢' : '🔴'}
                        </span>
                      </div>
                      <p className="text-gray-600 small mb-2">{item.description}</p>
                      <p className="fw-semibold text-green-600 mb-0">₹{item.price}</p>
                    </div>
                    
                    <div className="d-flex align-items-center">
                      <div className="btn-group me-3" role="group">
                        <button
                          onClick={() => handleRemoveFromCart(item)}
                          className="btn btn-outline-orange"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="btn btn-outline-orange fw-semibold" style={{ minWidth: '3rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="btn btn-outline-orange"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="fw-semibold text-gray-900 mb-0" style={{ minWidth: '4rem', textAlign: 'right' }}>
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="bg-white rounded-xl shadow-custom p-4 sticky-top-custom">
              <h3 className="h5 fw-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="d-flex justify-content-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="d-flex justify-content-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="d-flex justify-content-between text-gray-600">
                  <span>Tax & Fees</span>
                  <span>₹{tax}</span>
                </div>
                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between h5 fw-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              {deliveryFee > 0 && (
                <div className="alert alert-info mb-4">
                  <p className="small mb-0">
                    Add ₹{200 - subtotal} more to get free delivery!
                  </p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger text-center" role="alert">
                  {error}
                </div>
              )}
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border text-orange-500" role="status">
                    <span className="visually-hidden">Placing order...</span>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-medium text-gray-700">
                  Delivery Address
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Enter delivery address"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handlePlaceOrder}
                className="btn btn-orange w-100 fw-semibold transition-all transform-scale"
                disabled={loading}
              >
                Place Order • ₹{total}
              </button>

              <div className="mt-3 text-center">
                <Link
                  to={`/restaurant/${state.cartRestaurant?.id}`}
                  className="text-orange-500 small text-decoration-none"
                >
                  Add more items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;