import logger from '../config/logger';
import { getPool } from '../config/database';
import { InventoryForecast } from '../types';
import { config } from '../config';

export class ForecastingService {
  private pool = getPool();

  async forecast(
    productId: string,
    warehouseId: string
  ): Promise<InventoryForecast> {
    const lookbackDays = config.inventory.forecastingLookbackDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

    // Get historical sales data
    const salesResult = await this.pool.query(
      `SELECT 
        COUNT(*) as sale_count,
        SUM(ABS(quantity_change)) as total_sold,
        AVG(ABS(quantity_change)) as avg_sale_quantity
      FROM inventory_history
      WHERE product_id = $1 
        AND warehouse_id = $2
        AND change_type = 'sale'
        AND created_at >= $3`,
      [productId, warehouseId, cutoffDate]
    );

    const salesData = salesResult.rows[0];

    // Get current inventory
    const inventoryResult = await this.pool.query(
      `SELECT quantity, reserved_quantity, available_quantity 
       FROM inventory 
       WHERE product_id = $1 AND warehouse_id = $2`,
      [productId, warehouseId]
    );

    if (inventoryResult.rows.length === 0) {
      throw new Error('Inventory not found');
    }

    const currentQuantity = inventoryResult.rows[0].available_quantity;
    const totalSold = parseInt(salesData.total_sold || '0', 10);
    const saleCount = parseInt(salesData.sale_count || '0', 10);

    // Calculate average daily sales
    const daysInPeriod = lookbackDays;
    const avgDailySales = saleCount > 0 ? totalSold / daysInPeriod : 0;

    // Forecast days until stockout
    let daysUntilStockout = 0;
    if (avgDailySales > 0) {
      daysUntilStockout = Math.floor(currentQuantity / avgDailySales);
    } else {
      daysUntilStockout = 999; // Infinite if no sales history
    }

    // Recommended order quantity (30 days of sales + safety stock)
    const safetyStock = avgDailySales * 7; // 7 days safety stock
    const recommendedOrderQuantity = Math.ceil(avgDailySales * 30 + safetyStock);

    // Calculate confidence (more data = higher confidence)
    const confidence = Math.min(1, saleCount / 100); // Max confidence at 100+ sales

    return {
      product_id: productId,
      warehouse_id: warehouseId,
      forecasted_quantity: Math.max(0, currentQuantity - (avgDailySales * 7)), // 7-day forecast
      days_until_stockout: daysUntilStockout,
      recommended_order_quantity: recommendedOrderQuantity,
      confidence: confidence,
    };
  }

  async forecastAll(
    warehouseId?: string
  ): Promise<InventoryForecast[]> {
    let query = `
      SELECT DISTINCT product_id, warehouse_id 
      FROM inventory
    `;
    const params: unknown[] = [];

    if (warehouseId) {
      query += ' WHERE warehouse_id = $1';
      params.push(warehouseId);
    }

    const result = await this.pool.query(query, params);

    const forecasts: InventoryForecast[] = [];

    for (const row of result.rows) {
      try {
        const forecast = await this.forecast(row.product_id, row.warehouse_id);
        forecasts.push(forecast);
      } catch (error) {
        logger.warn('Failed to generate forecast', {
          product_id: row.product_id,
          warehouse_id: row.warehouse_id,
          error,
        });
      }
    }

    return forecasts;
  }
}

