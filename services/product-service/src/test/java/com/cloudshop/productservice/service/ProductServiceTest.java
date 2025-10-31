package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.ProductRequest;
import com.cloudshop.productservice.dto.ProductResponse;
import com.cloudshop.productservice.exception.ResourceNotFoundException;
import com.cloudshop.productservice.model.Product;
import com.cloudshop.productservice.repository.ProductRepository;
import com.cloudshop.productservice.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ValidationService validationService;

    @Mock
    private SearchService searchService;

    @InjectMocks
    private ProductService productService;

    private UUID productId;
    private UUID merchantId;
    private Product product;
    private ProductRequest productRequest;
    private ProductResponse productResponse;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        merchantId = UUID.randomUUID();

        product = Product.builder()
                .id(productId)
                .merchantId(merchantId)
                .name("Test Product")
                .description("Test Description")
                .sku("TEST-SKU-001")
                .price(new BigDecimal("99.99"))
                .isActive(true)
                .build();

        productRequest = ProductRequest.builder()
                .name("Test Product")
                .description("Test Description")
                .sku("TEST-SKU-001")
                .price(new BigDecimal("99.99"))
                .build();

        productResponse = ProductResponse.builder()
                .id(productId)
                .merchantId(merchantId)
                .name("Test Product")
                .description("Test Description")
                .sku("TEST-SKU-001")
                .price(new BigDecimal("99.99"))
                .isActive(true)
                .build();
    }

    @Test
    void testGetProductById_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(reviewRepository.findAverageRatingByProductId(productId)).thenReturn(4.5);
        when(reviewRepository.countByProductId(productId)).thenReturn(10L);
        when(productMapper.toProductResponseWithStats(product, 4.5, 10L)).thenReturn(productResponse);

        ProductResponse response = productService.getProductById(productId);

        assertNotNull(response);
        assertEquals(productId, response.getId());
        verify(productRepository).findById(productId);
    }

    @Test
    void testGetProductById_NotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(productId));
    }

    @Test
    void testCreateProduct_Success() {
        when(productRepository.existsBySku(productRequest.getSku())).thenReturn(false);
        when(productMapper.toProduct(productRequest)).thenReturn(product);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toProductResponse(product)).thenReturn(productResponse);

        ProductResponse response = productService.createProduct(productRequest, merchantId);

        assertNotNull(response);
        verify(productRepository).save(any(Product.class));
        verify(searchService).indexProduct(any(Product.class));
    }

    @Test
    void testCreateProduct_DuplicateSku() {
        when(productRepository.existsBySku(productRequest.getSku())).thenReturn(true);

        assertThrows(IllegalArgumentException.class, 
                () -> productService.createProduct(productRequest, merchantId));
    }

    @Test
    void testDeleteProduct_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        productService.deleteProduct(productId, merchantId);

        assertFalse(product.getIsActive());
        verify(productRepository).save(product);
        verify(searchService).removeProduct(productId);
    }
}

