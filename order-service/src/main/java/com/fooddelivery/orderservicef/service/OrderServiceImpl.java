package com.fooddelivery.orderservicef.service;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.orderservicef.dto.AgentAssignmentDTO;
import com.fooddelivery.orderservicef.dto.AgentResponseDTO;
// New import
import com.fooddelivery.orderservicef.dto.CartDTO;
import com.fooddelivery.orderservicef.dto.DeliveryStatus;
import com.fooddelivery.orderservicef.dto.DeliveryStatusUpdateRequestDTO;
import com.fooddelivery.orderservicef.dto.OrderDTO;
import com.fooddelivery.orderservicef.dto.OrderItemDTO;
import com.fooddelivery.orderservicef.dto.OrderRequestDTO;
import com.fooddelivery.orderservicef.dto.OrderStatusUpdateDTO;
import com.fooddelivery.orderservicef.dto.PaymentMethod;
import com.fooddelivery.orderservicef.dto.PaymentRequestDTO;
import com.fooddelivery.orderservicef.dto.PaymentResponseDTO;
import com.fooddelivery.orderservicef.exception.InvalidOperationException;
import com.fooddelivery.orderservicef.exception.ResourceNotFoundException;
import com.fooddelivery.orderservicef.model.Order;
import com.fooddelivery.orderservicef.model.OrderItem;
import com.fooddelivery.orderservicef.model.OrderStatus;
import com.fooddelivery.orderservicef.repository.OrderItemRepository;
import com.fooddelivery.orderservicef.repository.OrderRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OrderServiceImpl implements OrderService {
	
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartServiceImpl cartServiceImpl;
    private final PaymentServiceClient paymentServiceClient;
    private final RestaurantServiceClient restaurantServiceClient;
    private final AgentServiceClient agentServiceClient; // Changed type
   
    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            CartServiceImpl cartServiceImpl,
                            PaymentServiceClient paymentServiceClient,
                            RestaurantServiceClient restaurantServiceClient,
                            AgentServiceClient agentServiceClient) { // Changed parameter type
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartServiceImpl = cartServiceImpl;
        this.paymentServiceClient = paymentServiceClient;
        this.restaurantServiceClient = restaurantServiceClient;
        this.agentServiceClient = agentServiceClient; // Changed assignment
    }

    @Transactional(isolation = Isolation.SERIALIZABLE, timeout = 30)
    public OrderDTO placeOrder(OrderRequestDTO request, String idempotencyKey) {
        log.info("Received place order request: userId={}, restaurantId={}, idempotencyKey={}",
                request.getUserId(), request.getRestaurantId(), idempotencyKey);

        try {
            // Idempotency check
            if (orderRepository.existsByIdempotencyKey(idempotencyKey)) {
                log.warn("Duplicate order for idempotencyKey={}", idempotencyKey);
                return orderRepository.findByidempotencyKey(idempotencyKey)
                        .map(this::convertToDTO)
                        .orElseThrow(() -> {
                            log.error("Idempotency key exists but order not found. Key={}", idempotencyKey);
                            return new IllegalStateException("Inconsistent idempotency state");
                        });
            }

            Long userId = request.getUserId();
            Long restaurantId = request.getRestaurantId();

            if (userId == null || restaurantId == null) {
                log.error("Missing required fields: userId or restaurantId is null");
                throw new InvalidOperationException("User ID and Restaurant ID are required");
            }
            CartDTO cart = cartServiceImpl.getOrCreateCart(request.getUserId());

            if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
                log.warn("Attempt to place order with empty cart for userId={}", request.getUserId());
                throw new InvalidOperationException("Cannot place order with empty cart");
            }

            BigDecimal totalAmount = calculateTotalAmount(cart);
            log.info("Total order amount: {}", totalAmount);

            // 1. Create Order object without paymentId
            Order order = createOrder(request, idempotencyKey, totalAmount);
            List<OrderItem> orderItems = convertCartItemsToOrderItems(cart, order);
            order.setItems(orderItems);

            // 2. Save the order and items first to generate orderId
            Order savedOrder = orderRepository.save(order);
            orderItemRepository.saveAll(orderItems);

            // 3. Process payment using orderId
            PaymentResponseDTO paymentResponse;
            try {
                paymentResponse = processPayment(savedOrder);
                savedOrder.setPaymentId(paymentResponse.getPaymentId());
                orderRepository.save(savedOrder); // update with paymentId
            } catch (Exception ex) {
                log.error("Payment failed for orderId={}, userId={}", savedOrder.getOrderId(), userId, ex);
                throw new InvalidOperationException("Payment processing failed");
            }
               
            cartServiceImpl.clearCart(userId);
            log.info("Order placed with ID={} and paymentId={}", savedOrder.getOrderId(), savedOrder.getPaymentId());
            return convertToDTO(savedOrder);

        } catch (InvalidOperationException | ResourceNotFoundException ex) {
            log.error("Business validation failed during order placement", ex);
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while placing order", ex);
            throw new RuntimeException("Failed to place order", ex);
        }
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ, timeout = 10)
    public OrderDTO updateOrderStatus(OrderStatusUpdateDTO statusUpdateDTO) {
        log.info("Updating order status: orderId={}, newStatus={}, restaurantId={}",
                statusUpdateDTO.getOrderId(), statusUpdateDTO.getStatus(), statusUpdateDTO.getRestaurantId());

        try {
            Order order = orderRepository.findByIdWithLock(statusUpdateDTO.getOrderId())
                    .orElseThrow(() -> {
                        log.error("Order not found for ID={}", statusUpdateDTO.getOrderId());
                        return new ResourceNotFoundException("Order not found");
                    });

            if (!order.getRestaurantId().equals(statusUpdateDTO.getRestaurantId())) {
                log.warn("Unauthorized update attempt by restaurantId={} for orderId={}",
                        statusUpdateDTO.getRestaurantId(), order.getOrderId());
                throw new InvalidOperationException("Restaurant is not authorized to update this order");
            }

            if (!order.getStatus().canTransitionTo(statusUpdateDTO.getStatus())) {
                log.warn("Invalid status transition from {} to {}",
                        order.getStatus(), statusUpdateDTO.getStatus());
                throw new InvalidOperationException(String.format("Invalid status transition from %s to %s",
                        order.getStatus(), statusUpdateDTO.getStatus()));
            }
               
            OrderStatus oldStatus = order.getStatus();
            order.setStatus(statusUpdateDTO.getStatus());

            handleStatusUpdatesAfterTransition(order);

            Order updatedOrder = orderRepository.save(order);

            log.info("Order status updated successfully for orderId={} to status={}",
                    updatedOrder.getOrderId(), updatedOrder.getStatus());

            return convertToDTO(updatedOrder);

        } catch (InvalidOperationException | ResourceNotFoundException ex) {
            log.error("Order status update failed due to validation", ex);
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while updating order status", ex);
            throw new RuntimeException("Failed to update order status", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getUserOrders(Long userId) {
        log.info("user orders retrieved !");
        return orderRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getRestaurantOrders(Long restaurantId, OrderStatus status) {
        log.info("restaurant orders retrieved !");
        return orderRepository.findByRestaurantIdAndStatus(restaurantId, status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderDetails(Long orderId) {
        log.info(" order "+orderId+ " details retrieved !");
        return orderRepository.findById(orderId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    @Transactional(readOnly = true)
    public boolean orderExists(String idempotencyKey) {
        return orderRepository.existsByIdempotencyKey(idempotencyKey);
    }

    private BigDecimal calculateTotalAmount(CartDTO cartDTO) {
        return cartDTO.getItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Order createOrder(OrderRequestDTO request, String idempotencyKey, BigDecimal totalAmount) {
        Order order = new Order();
        order.setIdempotencyKey(idempotencyKey);
        order.setUserId(request.getUserId());
        order.setRestaurantId(request.getRestaurantId());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalAmount(totalAmount);
        order.setOrderTime(LocalDateTime.now());
        order.setDeliveryAddress(request.getDeliveryAddress());
        return order;
    }

    private List<OrderItem> convertCartItemsToOrderItems(CartDTO cartDTO, Order order) {
        return cartDTO.getItems().stream()
                .map(cartItem -> {
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(order);
                    orderItem.setMenuItemId(cartItem.getMenuItemId());
                    orderItem.setItemName(cartItem.getItemName());
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setPrice(cartItem.getPrice());
                    return orderItem;
                })
                .collect(Collectors.toList());
    }

    private PaymentResponseDTO processPayment(Order order) {
            PaymentRequestDTO paymentRequest = new PaymentRequestDTO();
            paymentRequest.setOrderId(order.getOrderId());
            paymentRequest.setPaymentAmount(order.getTotalAmount());
            paymentRequest.setPaymentMethod(PaymentMethod.Card);
            paymentRequest.setCreatedBy(order.getUserId().toString());
            return paymentServiceClient.processPayment(paymentRequest);
        }

    private void handleStatusUpdatesAfterTransition(Order order) {
        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            assignDeliveryAgent(order);
            CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(Duration.ofSeconds(30 + new Random().nextInt(16)).toMillis());
                    completeOrderAsync(order.getOrderId());
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt(); // Restore interrupt status
                    log.warn("Order auto-completion interrupted for orderId={}", order.getOrderId());
                }
            });
        } else if (order.getStatus() == OrderStatus.COMPLETED) {
            order.setDeliveryTime(LocalDateTime.now());
            // New: Update delivery status in delivery-service when order is completed
            if (order.getDeliveryId() != null) {
                try {
                    DeliveryStatusUpdateRequestDTO statusUpdate = DeliveryStatusUpdateRequestDTO.builder()
                            .status(DeliveryStatus.DELIVERED) // Matches DeliveryStatus.DELIVERED enum name
                            .estimatedDeliveryTime(LocalDateTime.now()) // Set actual delivery time
                            .build();
                    agentServiceClient.updateDeliveryStatus(order.getDeliveryId(), statusUpdate);
                    log.info("Delivery status updated to DELIVERED in delivery-service for deliveryId={}", order.getDeliveryId());
                } catch (Exception e) {
                    log.error("Failed to update delivery status in delivery-service for orderId={}: {}", order.getOrderId(), e.getMessage());
                    // Consider retry mechanism or alerting if this is critical
                }
            } else {
                log.warn("Order {} completed but no deliveryId found. Cannot update delivery-service status.", order.getOrderId());
            }
        }
    }

    @Transactional
    protected void completeOrderAsync(Long orderId) {
        Order o = orderRepository.findByIdWithLock(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found in async complete"));

        if (o.getStatus() == OrderStatus.OUT_FOR_DELIVERY && o.getStatus().canTransitionTo(OrderStatus.COMPLETED)) {
            o.setStatus(OrderStatus.COMPLETED);
            o.setDeliveryTime(LocalDateTime.now());
            orderRepository.save(o);
            log.info("Order auto-completed via async flow, orderId={}", orderId);
            // After auto-completion, call handleStatusUpdatesAfterTransition to propagate status
            handleStatusUpdatesAfterTransition(o);
        }
    }

    private void assignDeliveryAgent(Order order) {
        AgentAssignmentDTO assignmentDTO = new AgentAssignmentDTO();
        assignmentDTO.setOrderId(order.getOrderId());
        assignmentDTO.setRestaurantId(order.getRestaurantId());
        assignmentDTO.setDeliveryAddress(order.getDeliveryAddress());
        AgentResponseDTO agentResponse = agentServiceClient.assignDeliveryAgent(assignmentDTO);
        order.setDeliveryAgentId(agentResponse.getAgentId());
        order.setDeliveryId(agentResponse.getDeliveryId()); // Set deliveryId from response
        orderRepository.save(order); // Persist the updated order with deliveryId
    }
       
    public OrderDTO convertToDTO(Order order) {
        log.info("Converting Order to DTO: {}", order.getOrderId());
        if (order == null) return null;

        OrderDTO dto = new OrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setUserId(order.getUserId());
        dto.setRestaurantId(order.getRestaurantId());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setOrderTime(order.getOrderTime());
        dto.setDeliveryTime(order.getDeliveryTime());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentId(order.getPaymentId());
        dto.setIdempotencyKey(order.getIdempotencyKey());
        dto.setDeliveryAgentId(order.getDeliveryAgentId());
        dto.setDeliveryId(order.getDeliveryId()); // Map the new deliveryId field

        if (order.getItems() != null) {
            List<OrderItemDTO> items = order.getItems().stream()
                .map(item -> {
                    OrderItemDTO itemDTO = new OrderItemDTO();
                    itemDTO.setMenuItemId(item.getMenuItemId());
                    itemDTO.setItemName(item.getItemName());
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setPrice(item.getPrice());
                    return itemDTO;
                })
                .collect(Collectors.toList());
            dto.setItems(items);
        } else {
            dto.setItems(Collections.emptyList());
        }
        return dto;
    }
      
    private OrderItemDTO convertToDTO(OrderItem orderItem) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setMenuItemId(orderItem.getMenuItemId());
        dto.setItemName(orderItem.getItemName());
        dto.setQuantity(orderItem.getQuantity());
        dto.setPrice(orderItem.getPrice());
        return dto;
    }
}
