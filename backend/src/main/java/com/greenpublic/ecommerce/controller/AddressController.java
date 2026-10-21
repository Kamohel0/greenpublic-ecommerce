package com.greenpublic.ecommerce.controller;

import com.greenpublic.ecommerce.dto.AddressRequest;
import com.greenpublic.ecommerce.dto.AddressResponse;
import com.greenpublic.ecommerce.entity.Address;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.repository.UserRepository;
import com.greenpublic.ecommerce.service.AddressService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;
    private final UserRepository userRepository;

    public AddressController(AddressService addressService, UserRepository userRepository) {
        this.addressService = addressService;
        this.userRepository = userRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<Address> createAddress(
        @RequestBody AddressRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Address savedAddress = addressService.createAddress(request, user);
        return new ResponseEntity<>(savedAddress, HttpStatus.CREATED);
    }

@GetMapping
public ResponseEntity<List<AddressResponse>> getMyAddresses(
        @AuthenticationPrincipal UserDetails userDetails
) {
    User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    List<AddressResponse> addresses = addressService.getAddressesForUser(user);
    return ResponseEntity.ok(addresses);
}


}
