package com.fooddelivery.orderservicef.dto;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
	private Long id; 
    private Long menuItemId;
    private String itemName;
    private Integer quantity;
    private BigDecimal price;
}