package com.cloudshop.productservice.controller;

import com.cloudshop.productservice.dto.*;
import com.cloudshop.productservice.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private BulkImportService bulkImportService;

    @MockBean
    private ImageService imageService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID productId = UUID.randomUUID();
    private UUID merchantId = UUID.randomUUID();

    @Test
    void testGetProductById_Success() throws Exception {
        ProductResponse response = ProductResponse.builder()
                .id(productId)
                .name("Test Product")
                .price(new BigDecimal("99.99"))
                .build();

        when(productService.getProductById(productId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId.toString()))
                .andExpect(jsonPath("$.name").value("Test Product"));
    }

    @Test
    void testCreateProduct_Success() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("New Product")
                .sku("NEW-SKU-001")
                .price(new BigDecimal("149.99"))
                .build();

        ProductResponse response = ProductResponse.builder()
                .id(productId)
                .name("New Product")
                .price(new BigDecimal("149.99"))
                .build();

        when(productService.createProduct(any(ProductRequest.class), any(UUID.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/products")
                        .header("X-Merchant-Id", merchantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(productId.toString()))
                .andExpect(jsonPath("$.name").value("New Product"));
    }

    @Test
    void testSearchProducts_Success() throws Exception {
        ProductResponse product1 = ProductResponse.builder()
                .id(UUID.randomUUID())
                .name("Product 1")
                .build();

        ProductResponse product2 = ProductResponse.builder()
                .id(UUID.randomUUID())
                .name("Product 2")
                .build();

        PageResponse<ProductResponse> pageResponse = PageResponse.<ProductResponse>builder()
                .content(Arrays.asList(product1, product2))
                .page(0)
                .size(20)
                .totalElements(2L)
                .totalPages(1)
                .first(true)
                .last(true)
                .build();

        when(productService.searchProducts(any(ProductSearchRequest.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products/search")
                        .param("query", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2));
    }
}

