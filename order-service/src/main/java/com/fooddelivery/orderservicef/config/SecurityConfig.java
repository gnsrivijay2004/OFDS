package com.fooddelivery.orderservicef.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	 @Bean
		SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		 http
         .csrf(csrf -> csrf.disable())
         .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
         .authorizeHttpRequests(authorize -> authorize
             .anyRequest().permitAll()
         );

			return http.build();
		}
}