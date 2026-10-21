package com.greenpublic.ecommerce.repository;

import com.greenpublic.ecommerce.entity.Address;
import com.greenpublic.ecommerce.entity.User;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);
}

