package com.fooddelivery.orderservicef.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {
    private Long userId;
    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;
}