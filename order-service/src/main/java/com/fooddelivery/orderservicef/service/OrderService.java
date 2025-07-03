package com.fooddelivery.orderservicef.service;

import java.util.List;
import java.util.UUID;

import com.fooddelivery.orderservicef.dto.OrderDTO;
import com.fooddelivery.orderservicef.dto.OrderRequestDTO;
import com.fooddelivery.orderservicef.dto.OrderStatusUpdateDTO;
import com.fooddelivery.orderservicef.model.OrderStatus;

public interface OrderService {

    OrderDTO placeOrder(OrderRequestDTO request, String idempotencyKey);

    OrderDTO updateOrderStatus(OrderStatusUpdateDTO statusUpdateDTO);

    List<OrderDTO> getUserOrders(Long userId);

    List<OrderDTO> getRestaurantOrders(Long restaurantId, OrderStatus status);

    OrderDTO getOrderDetails(Long orderId);

    boolean orderExists(String idempotencyKey);
}
