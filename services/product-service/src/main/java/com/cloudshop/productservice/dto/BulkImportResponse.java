package com.cloudshop.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponse {

    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<String> errors;
}

