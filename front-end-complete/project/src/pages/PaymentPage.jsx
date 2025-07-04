import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import { useApp } from '../context/AppContext';

function PaymentPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 200 ? 0 : 30;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  // Helper to get JWT from localStorage
  const getToken = () => localStorage.getItem('jwt');

  // Use orderId from state if coming from CartPage, else fallback
  const orderId = state.orders.length > 0 ? state.orders[0].id : `ORD${Date.now()}`;

  const handlePayment = async () => {
    if (!agreed) {
      alert('Please agree to the terms and conditions');
      return;
    }
    // Validate payment method specific fields
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
        alert('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        alert('Please enter your UPI ID');
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Initiate payment
      const paymentPayload = {
        orderId,
        amount: total,
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? cardDetails : undefined,
        upiId: paymentMethod === 'upi' ? upiId : undefined
      };
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(paymentPayload)
      });
      if (!res.ok) throw new Error('Payment initiation failed');
      const paymentData = await res.json();
      // 2. Confirm payment (simulate for card/upi, skip for COD)
      if (paymentMethod !== 'cod') {
        const confirmRes = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify({ orderId, paymentId: paymentData.paymentId })
        });
        if (!confirmRes.ok) throw new Error('Payment confirmation failed');
      }
      // 3. Clear cart, update orders, redirect
      dispatch({ type: 'CLEAR_CART' });
      // Optionally fetch latest orders or add paymentData to orders
      navigate('/payment/success', { state: { orderId, total, paymentMethod } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardInputChange = (e) => {
    setCardDetails({
      ...cardDetails,
      [e.target.name]: e.target.value
    });
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h2 className="h3 fw-bold text-gray-900 mb-3">No items in cart</h2>
          <Link to="/main" className="text-orange-500 text-decoration-none">
            Go back to main page
          </Link>
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
              to="/cart" 
              className="btn btn-link p-2 text-gray-600 text-decoration-none me-3"
              style={{ borderRadius: '0.5rem' }}
            >
              <ArrowLeft size={24} />
            </Link>
            <h1 className="h3 fw-bold text-gray-900 mb-0">Payment</h1>
          </div>
        </div>
      </header>

      <div className="container py-4" style={{ maxWidth: '80rem' }}>
        <div className="row g-4">
          {/* Payment Details */}
          <div className="col-lg-8">
            <div className="bg-white rounded-xl shadow-custom p-4">
              <h2 className="h4 fw-bold text-gray-900 mb-4">Payment Method</h2>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-4">
                {/* Card Payment */}
                <div className={`border rounded p-3 cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`} onClick={() => setPaymentMethod('card')} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="form-check-input me-3"
                    />
                    <CreditCard className="text-primary me-2" size={24} />
                    <div>
                      <h6 className="fw-semibold text-gray-900 mb-0">Credit/Debit Card</h6>
                      <p className="small text-gray-600 mb-0">Pay securely with your card</p>
                    </div>
                  </div>
                </div>

                {/* UPI Payment */}
                <div className={`border rounded p-3 cursor-pointer transition-all ${
                  paymentMethod === 'upi' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`} onClick={() => setPaymentMethod('upi')} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="form-check-input me-3"
                    />
                    <Smartphone className="text-purple-500 me-2" size={24} />
                    <div>
                      <h6 className="fw-semibold text-gray-900 mb-0">UPI Payment</h6>
                      <p className="small text-gray-600 mb-0">Pay using UPI ID or QR code</p>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div className={`border rounded p-3 cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`} onClick={() => setPaymentMethod('cod')} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="form-check-input me-3"
                    />
                    <Banknote className="text-success me-2" size={24} />
                    <div>
                      <h6 className="fw-semibold text-gray-900 mb-0">Cash on Delivery</h6>
                      <p className="small text-gray-600 mb-0">Pay when your order arrives</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Forms */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 mb-4">
                  <h6 className="fw-semibold text-gray-900 mb-3">Card Details</h6>
                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="1234 1234 1234 1234"
                      className="form-control"
                      value={cardDetails.cardNumber}
                      onChange={handleCardInputChange}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-medium text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        placeholder="MM/YY"
                        className="form-control"
                        value={cardDetails.expiryDate}
                        onChange={handleCardInputChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        placeholder="123"
                        className="form-control"
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium text-gray-700">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      placeholder="Name on card"
                      className="form-control"
                      value={cardDetails.cardholderName}
                      onChange={handleCardInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              {paymentMethod === 'upi' && (
                <div className="mb-4">
                  <label className="form-label fw-medium text-gray-700">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    placeholder="yourname@upi"
                    className="form-control"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Terms and Place Order */}
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  id="agreeTerms"
                  disabled={loading}
                />
                <label className="form-check-label text-gray-700" htmlFor="agreeTerms">
                  I agree to the <a href="#" className="text-orange-500">terms and conditions</a>
                </label>
              </div>

              {error && (
                <div className="alert alert-danger text-center" role="alert">
                  {error}
                </div>
              )}
              {loading && (
                <div className="text-center py-2">
                  <div className="spinner-border text-orange-500" role="status">
                    <span className="visually-hidden">Processing payment...</span>
                  </div>
                </div>
              )}

              <button
                className="btn btn-orange w-100 fw-semibold transition-all transform-scale"
                onClick={handlePayment}
                disabled={loading}
              >
                Pay ₹{total}
              </button>
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
              <div className="alert alert-info mb-4">
                <p className="small mb-0">
                  You will receive an order confirmation and payment receipt after successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;