import React from 'react';

function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  icon: Icon
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-orange';
      case 'secondary': return 'btn-outline-orange';
      case 'success': return 'btn-green';
      case 'danger': return 'btn btn-danger';
      case 'ghost': return 'btn btn-link text-gray-600';
      default: return 'btn-orange';
    }
  };
  
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'btn-sm';
      case 'md': return '';
      case 'lg': return 'btn-lg';
      case 'full': return 'w-100';
      default: return '';
    }
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${getVariantClass()} ${getSizeClass()} d-flex align-items-center justify-content-center transition-all transform-scale ${className}`}
    >
      {Icon && <Icon className="me-2" size={20} />}
      {children}
    </button>
  );
}

export default Button;