package com.fooddelivery.orderservicef.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.orderservicef.dto.CartDTO;
import com.fooddelivery.orderservicef.dto.CartItemDTO;
import com.fooddelivery.orderservicef.dto.MenuItemDTO;
import com.fooddelivery.orderservicef.exception.InvalidOperationException;
import com.fooddelivery.orderservicef.exception.ResourceNotFoundException;
import com.fooddelivery.orderservicef.model.Cart;
import com.fooddelivery.orderservicef.model.CartItem;
import com.fooddelivery.orderservicef.repository.CartItemRepository;
import com.fooddelivery.orderservicef.repository.CartRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuServiceClient menuServiceClient;
   
    @Transactional
    public CartDTO getOrCreateCart(Long userId) {
        Optional<Cart> cartOptional = cartRepository.findByUserId(userId);
        if (cartOptional.isPresent()) {
        	log.info("cart already exists !");
            return convertToDTO(cartOptional.get());
        } else {
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            Cart savedCart = cartRepository.save(newCart);
            log.info("cart created !");
            return convertToDTO(savedCart);
        }
    }
    
    @Transactional

    public CartDTO addItemToCart(Long userId, CartItemDTO cartItemDTO) {

        if (cartItemDTO.getQuantity() < 1) {

            throw new InvalidOperationException("Quantity must be at least 1");

        }

        Long menuItemId = cartItemDTO.getMenuItemId();
        
        MenuItemDTO menuItemDTO = menuServiceClient.getMenuItemById(menuItemId);

        if (menuItemDTO == null) {

            throw new ResourceNotFoundException("Menu item not found in the restaurant's menu");

       }
        
        Cart cart = cartRepository.findByUserId(userId)

                .orElseGet(() -> {

                    Cart newCart = new Cart();

                    newCart.setUserId(userId);
                    
                    newCart.setRestaurantId(menuItemDTO.getRestaurantId()); 

                   // newCart.setRestaurantId(cartItemDTO.getRestaurantId()); // Default fallback

                    log.info("Cart created while adding item.");

                    return cartRepository.save(newCart);

                });

//        Long restaurantId = cart.getRestaurantId();



        // ✅ Menu Item Existence Check



        CartItem newItem = new CartItem();

        newItem.setCart(cart);
        
        newItem.setMenuItemId(menuItemId);

        newItem.setItemName(cartItemDTO.getItemName());

        newItem.setQuantity(cartItemDTO.getQuantity());

        newItem.setPrice(cartItemDTO.getPrice());

        cart.getItems().add(newItem);
        cart.setRestaurantId(menuItemDTO.getRestaurantId());
        cartItemRepository.save(newItem);

        return convertToDTO(cartRepository.save(cart));

    }


    @Transactional
    public CartDTO updateCartItem(Long userId, Long itemId, CartItemDTO cartItemDTO) {
    	if(cartItemDTO.getQuantity() < 1) {
    		throw new InvalidOperationException("Quantity must be at least 1");
    		}
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user"));

        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        item.setQuantity(cartItemDTO.getQuantity());
        cartItemRepository.save(item);
        log.info("cart item updated successfully !");
        return convertToDTO(cart);
    }

    @Transactional
    public void removeItemFromCart(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user"));

        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        log.info("Item deleted successfully from cart");
        cartRepository.save(cart);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user"));

        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        log.info("cart cleared successfully !");
        cartRepository.save(cart);
    }

    private CartDTO convertToDTO(Cart cart) {
        CartDTO cartDTO = new CartDTO();
        cartDTO.setId(cart.getId());
        cartDTO.setUserId(cart.getUserId());
        cartDTO.setRestaurantId(cart.getRestaurantId());
        


        List<CartItemDTO> itemDTOs = cart.getItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        cartDTO.setItems(itemDTOs);

        return cartDTO;
    }

    private CartItemDTO convertToDTO(CartItem cartItem) {
        CartItemDTO dto = new CartItemDTO();
        dto.setMenuItemId(cartItem.getMenuItemId());
        dto.setItemName(cartItem.getItemName());
        dto.setQuantity(cartItem.getQuantity());
        dto.setPrice(cartItem.getPrice());
        dto.setId(cartItem.getId());
        return dto;
    }
}