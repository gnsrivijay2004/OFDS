package com.example.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients(basePackages = "com.example.payment.client")
@EnableDiscoveryClient
@SpringBootApplication
public class PaymentModuleApplication {

	public static void main(String[] args) {
		SpringApplication.run(PaymentModuleApplication.class, args);
	}
}