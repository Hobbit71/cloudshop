package com.cloudshop.productservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${app.cache.product.ttl:3600}")
    private long productCacheTtl;

    @Value("${app.cache.category.ttl:7200}")
    private long categoryCacheTtl;

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(productCacheTtl))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        RedisCacheConfiguration productConfig = defaultConfig.entryTtl(Duration.ofSeconds(productCacheTtl));
        RedisCacheConfiguration categoryConfig = defaultConfig.entryTtl(Duration.ofSeconds(categoryCacheTtl));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("product", productConfig)
                .withCacheConfiguration("products", productConfig)
                .withCacheConfiguration("category", categoryConfig)
                .withCacheConfiguration("categories", categoryConfig)
                .build();
    }
}

