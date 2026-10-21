package com.greenpublic.ecommerce.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The product catalogue is public to read, but only ADMIN/OWNER may change it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductEndpointSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousCanListProducts() throws Exception {
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
    }

    @Test
    void anonymousCannotCreateProduct() throws Exception {
        mockMvc.perform(multipart("/api/products/create").param("name", "Hacked").param("price", "1"))
                .andExpect(status().is(anyOf(is(401), is(403))));
    }

    @Test
    void anonymousCannotDeleteProduct() throws Exception {
        mockMvc.perform(delete("/api/products/delete/1"))
                .andExpect(status().is(anyOf(is(401), is(403))));
    }

    @Test
    @WithMockUser(roles = "USER")
    void customerCannotDeleteProduct() throws Exception {
        mockMvc.perform(delete("/api/products/delete/1")).andExpect(status().isForbidden());
    }
}
