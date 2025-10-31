package com.cloudshop.productservice.service;

import com.cloudshop.productservice.dto.BulkImportResponse;
import com.cloudshop.productservice.dto.ProductRequest;
import com.cloudshop.productservice.model.Product;
import com.cloudshop.productservice.repository.ProductRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkImportService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ValidationService validationService;

    @Transactional
    public BulkImportResponse importProducts(MultipartFile file, UUID merchantId) {
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int totalRows = 0;

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String[]> rows = reader.readAll();
            totalRows = rows.size() - 1; // Exclude header

            // Skip header row
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows[i];
                try {
                    ProductRequest request = parseProductRow(row);
                    validationService.validateProductRequest(request);

                    if (productRepository.existsBySku(request.getSku())) {
                        errors.add("Row " + i + ": SKU already exists: " + request.getSku());
                        continue;
                    }

                    Product product = productMapper.toProduct(request);
                    product.setMerchantId(merchantId);
                    productRepository.save(product);
                    successCount++;

                } catch (Exception e) {
                    errors.add("Row " + i + ": " + e.getMessage());
                    log.error("Error importing row {}: {}", i, e.getMessage());
                }
            }

        } catch (IOException | CsvException e) {
            errors.add("Error reading CSV file: " + e.getMessage());
            log.error("Error reading CSV file", e);
        }

        return BulkImportResponse.builder()
                .totalRows(totalRows)
                .successCount(successCount)
                .failureCount(totalRows - successCount)
                .errors(errors)
                .build();
    }

    private ProductRequest parseProductRow(String[] row) {
        // CSV format: name, description, sku, price, categoryId, imageUrl
        if (row.length < 4) {
            throw new IllegalArgumentException("Invalid CSV row format");
        }

        ProductRequest.ProductRequestBuilder builder = ProductRequest.builder()
                .name(row[0])
                .description(row.length > 1 ? row[1] : null)
                .sku(row[2])
                .price(new BigDecimal(row[3]));

        if (row.length > 4 && !row[4].trim().isEmpty()) {
            builder.categoryId(UUID.fromString(row[4]));
        }

        if (row.length > 5 && !row[5].trim().isEmpty()) {
            builder.imageUrl(row[5]);
        }

        return builder.build();
    }
}

