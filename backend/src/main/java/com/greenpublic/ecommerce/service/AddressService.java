package com.greenpublic.ecommerce.service;

import com.greenpublic.ecommerce.dto.AddressRequest;
import com.greenpublic.ecommerce.dto.AddressResponse;
import com.greenpublic.ecommerce.entity.Address;
import com.greenpublic.ecommerce.entity.User;
import com.greenpublic.ecommerce.repository.AddressRepository;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;


@Service
public class AddressService {

    private static final Set<String> SA_PROVINCES = new HashSet<>(Arrays.asList(
            "Eastern Cape",
            "Free State",
            "Gauteng",
            "KwaZulu-Natal",
            "Limpopo",
            "Mpumalanga",
            "North West",
            "Northern Cape",
            "Western Cape"
    ));

    private static final Pattern SA_PHONE_E164 = Pattern.compile("^\\+27\\d{9}$");

    private final AddressRepository addressRepository;
  

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
       
    }

    @Transactional
public Address createAddress(AddressRequest request, User user) {
    Address address = buildValidatedAddress(request, user);
    return addressRepository.save(address);
}

    public Address buildValidatedAddress(AddressRequest request, User user) {
    if (request == null) {
        throw new RuntimeException("Address is required");
    }

    if (request.getProvince() == null || !SA_PROVINCES.contains(request.getProvince().trim())) {
        throw new RuntimeException("Invalid province selected");
    }

    String normalizedPhone = normalizeSouthAfricanPhone(request.getPhoneNo());
    if (!SA_PHONE_E164.matcher(normalizedPhone).matches()) {
        throw new RuntimeException("Invalid South African phone number");
    }

    Address address = new Address();
    address.setUser(user);
    address.setName(request.getName());
    address.setSurname(request.getSurname());
    address.setCompanyName(request.getCompanyName());
    address.setAddressLine1(request.getAddressLine1());
    address.setAddressLine2(request.getAddressLine2());
    address.setCountry(request.getCountry());
    address.setCity(request.getCity());
    address.setProvince(request.getProvince().trim());
    address.setPostalCode(request.getPostalCode());
    address.setPhoneNo(normalizedPhone);

    return address;
}

    public String normalizeSouthAfricanPhone(String phone) {
        if (phone == null) {
            throw new RuntimeException("Phone number is required");
        }

        String digits = phone.replaceAll("[^0-9+]", "");

        if (digits.startsWith("+27") && digits.length() == 12) {
            return digits;
        }

        if (digits.startsWith("27") && digits.length() == 11) {
            return "+" + digits;
        }

        if (digits.startsWith("0") && digits.length() == 10) {
            return "+27" + digits.substring(1);
        }

        if (digits.length() == 9 && Character.isDigit(digits.charAt(0))) {
            return "+27" + digits;
        }

        throw new RuntimeException("Invalid South African phone number");
    }



@Transactional(readOnly = true)
public List<AddressResponse> getAddressesForUser(User user) {
    return addressRepository.findByUser(user)
            .stream()
            .map(address -> {
                AddressResponse dto = new AddressResponse();
                dto.setId(address.getId());
                dto.setName(address.getName());
                dto.setSurname(address.getSurname());
                dto.setCompanyName(address.getCompanyName());
                dto.setAddressLine1(address.getAddressLine1());
                dto.setAddressLine2(address.getAddressLine2());
                dto.setCountry(address.getCountry());
                dto.setCity(address.getCity());
                dto.setProvince(address.getProvince());
                dto.setPostalCode(address.getPostalCode());
                dto.setPhoneNo(address.getPhoneNo());
                return dto;
            })
            .toList();
}


}
