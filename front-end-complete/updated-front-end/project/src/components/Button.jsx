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

  const handleClick = (e) => {
    console.log('Button component clicked!'); // Debugging log
    if (onClick) {
        onClick(e);
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

// components/Button.jsx
// import React from 'react';
// import { Loader2 } from 'lucide-react'; // For loading spinner

// /**
//  * A reusable button component with variant styling and optional icon/loading state.
//  * @param {object} props - Component props.
//  * @param {function} props.onClick - Click handler for the button.
//  * @param {'primary' | 'secondary' | 'danger' | 'success' | 'ghost'} [props.variant='primary'] - Visual style variant.
//  * @param {React.ElementType} [props.icon] - Icon component from lucide-react.
//  * @param {React.ReactNode} props.children - Content inside the button.
//  * @param {string} [props.type='button'] - Button type (e.g., 'submit', 'button').
//  * @param {boolean} [props.disabled=false] - Whether the button is disabled.
//  * @param {boolean} [props.isLoading=false] - Whether to show a loading spinner.
//  * @param {string} [props.size='md'] - Size variant ('sm', 'md', 'lg', 'full').
//  * @param {string} [props.className=''] - Additional custom Tailwind CSS classes.
//  */
// function Button({ 
//   children, 
//   onClick, 
//   type = 'button', 
//   variant = 'primary', 
//   size = 'md', 
//   disabled = false,
//   isLoading = false, // Re-added isLoading prop
//   className = '',
//   icon: Icon
// }) {
//   let baseClasses = "flex items-center justify-center font-semibold transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
//   let variantClasses = "";
//   let sizeClasses = "";

//   // Determine variant classes
//   switch (variant) {
//     case 'primary': 
//       variantClasses = "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500";
//       break;
//     case 'secondary': 
//       variantClasses = "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400";
//       break;
//     case 'success': 
//       variantClasses = "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500";
//       break;
//     case 'danger': 
//       variantClasses = "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
//       break;
//     case 'ghost': 
//       variantClasses = "text-gray-600 hover:text-orange-600 hover:bg-gray-100 focus:ring-gray-300";
//       break;
//     default: 
//       variantClasses = "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500";
//   }

//   // Determine size classes
//   switch (size) {
//     case 'sm': 
//       sizeClasses = "px-3 py-1.5 text-sm";
//       break;
//     case 'md': 
//       sizeClasses = "px-4 py-2 text-base";
//       break;
//     case 'lg': 
//       sizeClasses = "px-6 py-3 text-lg";
//       break;
//     case 'full': 
//       sizeClasses = "w-full px-4 py-2 text-base"; // Full width
//       break;
//     default: 
//       sizeClasses = "px-4 py-2 text-base";
//   }

//   const handleClick = (e) => {
//     console.log('Button component clicked!'); // Debugging log
//     if (onClick) {
//       onClick(e);
//     }
//   };

//   return (
//     <button
//       type={type}
//       onClick={handleClick}
//       disabled={disabled || isLoading} // Disabled when loading
//       className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//     >
//       {isLoading ? (
//         <Loader2 className="animate-spin mr-2" size={20} />
//       ) : (
//         Icon && <Icon className="mr-2" size={20} />
//       )}
//       {children}
//     </button>
//   );
// }

// export default Button;