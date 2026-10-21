package com.greenpublic.ecommerce.dto;

import lombok.Data;

@Data
public class AddressResponse {
    private Long id;
    private String name;
    private String surname;
    private String companyName;
    private String addressLine1;
    private String addressLine2;
    private String country;
    private String city;
    private String province;
    private String postalCode;
    private String phoneNo;
}
