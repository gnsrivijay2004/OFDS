//
//package com.example.payment.service;
//
//import com.example.payment.dto.PaymentRequestDTO;
//import com.example.payment.dto.PaymentResponseDTO;
//import com.example.payment.exception.DuplicateTransactionException;
//import com.example.payment.exception.ResourceNotFoundException;
//import com.example.payment.model.Payment;
//import com.example.payment.model.PaymentMethod;
//import com.example.payment.model.PaymentStatus;
//import com.example.payment.repository.PaymentRepository;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mockito;
//import org.modelmapper.ModelMapper;
//
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//public class PaymentServiceTest {
//
//    private PaymentService paymentService;
//    private PaymentRepository paymentRepository;
//    private ModelMapper modelMapper;
//
//    private PaymentRequestDTO paymentRequestDTO;
//    private Payment payment;
//
//    @BeforeEach
//    void setUp() {
//        paymentRepository = mock(PaymentRepository.class);
//        modelMapper = mock(ModelMapper.class);
//        paymentService = new PaymentServiceImpl(paymentRepository, modelMapper);
//
//        paymentRequestDTO = new PaymentRequestDTO();
//        paymentRequestDTO.setOrderId(1L);
//        paymentRequestDTO.setPaymentMethod(PaymentMethod.Card);
//        paymentRequestDTO.setPaymentAmount(100.0);
//        paymentRequestDTO.setCreatedBy("user");
//
//        payment = new Payment();
//        payment.setOrderId(1L);
//        payment.setPaymentMethod(PaymentMethod.Card);
//        payment.setPaymentAmount(100.0);
//        payment.setPaymentStatus(PaymentStatus.Pending);
//        payment.setCreatedBy("user");
//    }
//
//    @Test
//    void testInitiatePaymentSuccess() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
//        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
//        when(modelMapper.map(any(Payment.class), eq(PaymentResponseDTO.class))).thenReturn(new PaymentResponseDTO());
//
//        PaymentResponseDTO responseDTO = paymentService.initiatePayment(paymentRequestDTO);
//
//        assertNotNull(responseDTO);
//        verify(paymentRepository, times(1)).save(any(Payment.class));
//    }
//
//    @Test
//    void testInitiatePaymentDuplicate() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
//
//        assertThrows(DuplicateTransactionException.class, () -> paymentService.initiatePayment(paymentRequestDTO));
//    }
//
//    @Test
//    void testConfirmPaymentSuccess() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
//
//        paymentService.confirmPayment(paymentRequestDTO);
//
//        verify(paymentRepository, times(1)).save(any(Payment.class));
//        assertEquals(PaymentStatus.Success, payment.getPaymentStatus());
//    }
//
//    @Test
//    void testConfirmPaymentDuplicate() {
//        payment.setPaymentStatus(PaymentStatus.Success);
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
//
//        assertThrows(DuplicateTransactionException.class, () -> paymentService.confirmPayment(paymentRequestDTO));
//    }
//
//    @Test
//    void testConfirmPaymentNotFound() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
//
//        assertThrows(ResourceNotFoundException.class, () -> paymentService.confirmPayment(paymentRequestDTO));
//    }
//
//    @Test
//    void testGetPaymentDetailsSuccess() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
//        when(modelMapper.map(any(Payment.class), eq(PaymentResponseDTO.class))).thenReturn(new PaymentResponseDTO());
//
//        PaymentResponseDTO responseDTO = paymentService.getPaymentDetails(1L);
//
//        assertNotNull(responseDTO);
//        verify(paymentRepository, times(1)).findByOrderId(anyLong());
//    }
//
//    @Test
//    void testGetPaymentDetailsNotFound() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
//
//        assertThrows(ResourceNotFoundException.class, () -> paymentService.getPaymentDetails(1L));
//    }
//
//    @Test
//    void testDeletePaymentSuccess() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
//
//        paymentService.deletePaymentByOrderId(1L);
//
//        verify(paymentRepository, times(1)).delete(any(Payment.class));
//    }
//
//    @Test
//    void testDeletePaymentNotFound() {
//        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
//
//        assertThrows(ResourceNotFoundException.class, () -> paymentService.deletePaymentByOrderId(1L));
//    }
//}

package com.example.payment.service;

import com.example.payment.dto.PaymentRequestDTO;
import com.example.payment.dto.PaymentResponseDTO;
import com.example.payment.exception.DuplicateTransactionException;
import com.example.payment.exception.ResourceNotFoundException;
import com.example.payment.model.Payment;
import com.example.payment.model.PaymentMethod;
import com.example.payment.model.PaymentStatus;
import com.example.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    private PaymentService paymentService;
    private PaymentRepository paymentRepository;
    private ModelMapper modelMapper;

    private PaymentRequestDTO paymentRequestDTO;
    private Payment payment;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        modelMapper = mock(ModelMapper.class);
        paymentService = new PaymentServiceImpl(paymentRepository, modelMapper);

        paymentRequestDTO = new PaymentRequestDTO();
        paymentRequestDTO.setOrderId(1L);
        paymentRequestDTO.setPaymentMethod(PaymentMethod.Card);
        paymentRequestDTO.setPaymentAmount(100.0);
        paymentRequestDTO.setCreatedBy("user");

        payment = new Payment(); 
        payment.setOrderId(1L);
        payment.setPaymentMethod(PaymentMethod.Card);
        payment.setPaymentAmount(100.0);
        payment.setPaymentStatus(PaymentStatus.Pending);
        payment.setCreatedBy("user");
    }

    @Test
    void testInitiatePaymentSuccess() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenReturn(payment);
        when(modelMapper.map(any(Payment.class), eq(PaymentResponseDTO.class))).thenReturn(new PaymentResponseDTO());

        PaymentResponseDTO responseDTO = paymentService.initiatePayment(paymentRequestDTO);

        assertNotNull(responseDTO);
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }

    @Test
    void testInitiatePaymentDuplicate() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));

        assertThrows(DuplicateTransactionException.class, () -> paymentService.initiatePayment(paymentRequestDTO));
    }

    @Test
    void testConfirmPaymentSuccess() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));

        paymentService.confirmPayment(paymentRequestDTO);

        verify(paymentRepository, times(1)).save(any(Payment.class));
        assertEquals(PaymentStatus.Success, payment.getPaymentStatus());
    }

    @Test
    void testConfirmPaymentDuplicate() {
        payment.setPaymentStatus(PaymentStatus.Success);
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));

        assertThrows(DuplicateTransactionException.class, () -> paymentService.confirmPayment(paymentRequestDTO));
    }

    @Test
    void testConfirmPaymentNotFound() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.confirmPayment(paymentRequestDTO));
    }

    @Test
    void testGetPaymentDetailsSuccess() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));
        when(modelMapper.map(any(Payment.class), eq(PaymentResponseDTO.class))).thenReturn(new PaymentResponseDTO());

        PaymentResponseDTO responseDTO = paymentService.getPaymentDetails(1L);

        assertNotNull(responseDTO);
        verify(paymentRepository, times(1)).findByOrderId(anyLong());
    }

    @Test
    void testGetPaymentDetailsNotFound() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.getPaymentDetails(1L));
    }

    @Test
    void testDeletePaymentSuccess() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.of(payment));

        paymentService.deletePaymentByOrderId(1L);

        verify(paymentRepository, times(1)).delete(any(Payment.class));
    }

    @Test
    void testDeletePaymentNotFound() {
        when(paymentRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.deletePaymentByOrderId(1L));
    }
}
