import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const initialState = {
  user: null,
  userType: null, // 'customer' or 'restaurant'
  cart: [],
  cartRestaurant: null,
  restaurants: [], // Will be fetched from backend
  orders: [], // Will be fetched from backend
  currentRestaurant: null,
  loading: false,
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        userType: action.payload.userType
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        userType: null,
        cart: [],
        cartRestaurant: null
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RESTAURANTS':
      return { ...state, restaurants: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ADD_TO_CART':
      const { item, restaurant } = action.payload;
      if (state.cartRestaurant && state.cartRestaurant.id !== restaurant.id) {
        // Can't add from different restaurant
        return state;
      }
      const existingItem = state.cart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        };
      } else {
        return {
          ...state,
          cart: [...state.cart, { ...item, quantity: 1 }],
          cartRestaurant: state.cartRestaurant || restaurant
        };
      }
    case 'REMOVE_FROM_CART':
      const updatedCart = state.cart.map(cartItem =>
        cartItem.id === action.payload.id
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ).filter(cartItem => cartItem.quantity > 0);
      return {
        ...state,
        cart: updatedCart,
        cartRestaurant: updatedCart.length === 0 ? null : state.cartRestaurant
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
        cartRestaurant: null
      };
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders]
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };
    case 'SET_CURRENT_RESTAURANT':
      return {
        ...state,
        currentRestaurant: action.payload
      };
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        restaurants: state.restaurants.map(restaurant =>
          restaurant.id === action.payload.restaurantId
            ? {
                ...restaurant,
                menu: [...restaurant.menu, { ...action.payload.item, id: Date.now() }]
              }
            : restaurant
        )
      };
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        restaurants: state.restaurants.map(restaurant =>
          restaurant.id === action.payload.restaurantId
            ? {
                ...restaurant,
                menu: restaurant.menu.map(item =>
                  item.id === action.payload.item.id ? action.payload.item : item
                )
              }
            : restaurant
        )
      };
    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        restaurants: state.restaurants.map(restaurant =>
          restaurant.id === action.payload.restaurantId
            ? {
                ...restaurant,
                menu: restaurant.menu.filter(item => item.id !== action.payload.itemId)
              }
            : restaurant
        )
      };
    default:
      return state;
  }
}

// Helper to get JWT from localStorage
const getToken = () => localStorage.getItem('jwt');

// API base URL (should point to API Gateway)
const API_BASE = '/api';

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch restaurants from backend (only for customer view)
  const fetchRestaurants = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // This endpoint doesn't exist in the backend - restaurants are fetched individually
      // For now, we'll skip this call to avoid 404 errors
      console.log('Skipping fetchRestaurants - endpoint not implemented in backend');
      dispatch({ type: 'SET_RESTAURANTS', payload: [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch user orders from backend
  const fetchOrders = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/orders/user`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      dispatch({ type: 'SET_ORDERS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(`${API_BASE}/customers/user`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user profile');
      const data = await res.json();
      dispatch({ type: 'SET_USER', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // On mount, don't fetch restaurants automatically
  // Restaurants will be fetched when needed by individual components
  useEffect(() => {
    // No automatic restaurant fetching
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, fetchRestaurants, fetchOrders, fetchUserProfile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}