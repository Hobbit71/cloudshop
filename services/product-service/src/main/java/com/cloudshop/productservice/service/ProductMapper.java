package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.*;
import com.cloudshop.productservice.model.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductMapper {

    ProductResponse toProductResponse(Product product);

    ProductVariantResponse toProductVariantResponse(ProductVariant variant);

    CategoryResponse toCategoryResponse(Category category);

    ReviewResponse toReviewResponse(Review review);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "merchantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    Product toProduct(ProductRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProductVariant toProductVariant(ProductVariantRequest request);

    default ProductResponse toProductResponseWithStats(Product product, Double averageRating, Long reviewCount) {
        ProductResponse response = toProductResponse(product);
        if (averageRating != null) {
            response.setAverageRating(BigDecimal.valueOf(averageRating));
        }
        if (reviewCount != null) {
            response.setReviewCount(reviewCount.intValue());
        }
        return response;
    }

    List<ProductVariantResponse> toProductVariantResponseList(List<ProductVariant> variants);

    List<ProductResponse> toProductResponseList(List<Product> products);
}

