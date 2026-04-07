/**
 * RevenuePulse - Product Service
 * Handles product fetching, matching, and upsell recommendations
 * 
 * Features:
 * - fetchOrderProducts: Get products from an order via GraphQL
 * - matchUpsellProducts: Score and rank products for upsell
 * - getProductDetails: Get display info (image, price, title, variant)
 */

import { getStore } from '../models/store.js';

// ============================================
// GRAPHQL QUERIES
// ============================================

const ORDER_PRODUCTS_QUERY = `
  query orderProducts($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      lineItems(first: 50) {
        edges {
          node {
            product {
              id
              title
              vendor
              productType
              tags
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
            variant {
              id
              title
              price
              compareAtPrice
              inventoryQuantity
              image {
                url
                altText
              }
            }
            quantity
            title
          }
        }
      }
    }
  }
`;

const PRODUCT_DETAILS_QUERY = `
  query productDetails($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        vendor
        productType
        tags
        description
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              inventoryQuantity
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCTS_SEARCH_QUERY = `
  query productsSearch($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          vendor
          productType
          tags
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute GraphQL query against Shopify
 */
async function shopifyGraphQL(shopDomain, accessToken, query, variables) {
  const store = getStore(shopDomain);
  if (!store) {
    throw new Error(`Store not found: ${shopDomain}`);
  }

  const url = `https://${shopDomain}/admin/api/2024-01/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      'X-Shopify-Storefront-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

// ============================================
// PRODUCT FETCHING
// ============================================

/**
 * Fetch products from an order
 * 
 * @param {string} orderId - Shopify order ID
 * @param {string} shopDomain - Shop domain
 * @returns {Array} Array of product objects from the order
 */
export async function fetchOrderProducts(orderId, shopDomain) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    const data = await shopifyGraphQL(
      shopDomain,
      store.access_token,
      ORDER_PRODUCTS_QUERY,
      { orderId }
    );

    if (!data.order || !data.order.lineItems) {
      return [];
    }

    // Transform the GraphQL response into a cleaner format
    const products = data.order.lineItems.edges.map(({ node }) => ({
      product_id: node.product?.id || null,
      variant_id: node.variant?.id || null,
      title: node.title,
      product_title: node.product?.title || node.title,
      vendor: node.product?.vendor || '',
      product_type: node.product?.productType || '',
      tags: node.product?.tags || [],
      quantity: node.quantity,
      price: parseFloat(node.variant?.price || 0),
      image: node.variant?.image?.url || node.product?.images?.edges?.[0]?.node?.url || null,
      inventory: node.variant?.inventoryQuantity || 0
    }));

    return products;
  } catch (error) {
    console.error(`[ProductService] fetchOrderProducts error:`, error);
    throw error;
  }
}

/**
 * Get detailed product information
 * 
 * @param {Array<string>} productIds - Array of product IDs
 * @param {string} shopDomain - Shop domain
 * @returns {Array} Array of product detail objects
 */
export async function getProductDetails(productIds, shopDomain) {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    const data = await shopifyGraphQL(
      shopDomain,
      store.access_token,
      PRODUCT_DETAILS_QUERY,
      { ids: productIds }
    );

    if (!data.nodes) {
      return [];
    }

    // Transform the GraphQL response
    const products = data.nodes.map(node => {
      if (!node) return null;
      
      const firstVariant = node.variants?.edges?.[0]?.node;
      const firstImage = node.images?.edges?.[0]?.node;
      
      return {
        id: node.id,
        product_id: node.id,
        title: node.title,
        vendor: node.vendor,
        product_type: node.productType,
        tags: node.tags,
        description: node.description,
        image: firstImage?.url || null,
        image_alt: firstImage?.altText || node.title,
        variants: node.variants?.edges?.map(({ node: variant }) => ({
          id: variant.id,
          variant_id: variant.id,
          title: variant.title,
          price: parseFloat(variant.price),
          compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
          inventory: variant.inventoryQuantity,
          options: variant.selectedOptions
        })) || [],
        // Default to first variant details
        variant_id: firstVariant?.id || null,
        price: firstVariant ? parseFloat(firstVariant.price) : null,
        compare_at_price: firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice) : null,
        inventory: firstVariant?.inventoryQuantity || 0
      };
    }).filter(Boolean);

    return products;
  } catch (error) {
    console.error(`[ProductService] getProductDetails error:`, error);
    throw error;
  }
}

/**
 * Search products by query
 * 
 * @param {string} query - Search query
 * @param {string} shopDomain - Shop domain
 * @param {number} limit - Max results (default 20)
 * @returns {Array} Array of matching products
 */
export async function searchProducts(query, shopDomain, limit = 20) {
  try {
    const store = getStore(shopDomain);
    if (!store) {
      throw new Error(`Store not found: ${shopDomain}`);
    }

    const data = await shopifyGraphQL(
      shopDomain,
      store.access_token,
      PRODUCTS_SEARCH_QUERY,
      { query, first: limit }
    );

    if (!data.products) {
      return [];
    }

    const products = data.products.edges.map(({ node }) => {
      const firstVariant = node.variants?.edges?.[0]?.node;
      const firstImage = node.images?.edges?.[0]?.node;
      
      return {
        id: node.id,
        title: node.title,
        vendor: node.vendor,
        product_type: node.productType,
        tags: node.tags,
        image: firstImage?.url || null,
        variant_id: firstVariant?.id || null,
        price: firstVariant ? parseFloat(firstVariant.price) : null,
        compare_at_price: firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice) : null,
        inventory: firstVariant?.inventoryQuantity || 0
      };
    });

    return products;
  } catch (error) {
    console.error(`[ProductService] searchProducts error:`, error);
    throw error;
  }
}

// ============================================
// PRODUCT MATCHING ALGORITHM
// ============================================

/**
 * Match and score products for upsell recommendations
 * 
 * Scoring factors:
 * - Co-purchase frequency (historical data)
 * - Same category/type
 * - Complementary use case (tags)
 * - Price positioning (slightly higher than order average)
 * 
 * @param {Array} orderProducts - Products from the current order
 * @param {Object} offer - The offer configuration
 * @param {Array} availableProducts - Products that could be upsold
 * @returns {Array} Sorted array of scored products
 */
export function matchUpsellProducts(orderProducts, offer, availableProducts) {
  const orderProductIds = new Set(orderProducts.map(p => p.product_id?.toString()));
  const orderCategories = new Set(orderProducts.map(p => p.product_type).filter(Boolean));
  const orderTags = new Set(orderProducts.flatMap(p => p.tags || []));
  
  // Get offer configuration
  const productConfig = typeof offer.product_config === 'string' 
    ? JSON.parse(offer.product_config) 
    : offer.product_config;
  
  const excludeProductIds = new Set(productConfig.exclude_product_ids || []);
  
  // Score each available product
  const scoredProducts = availableProducts
    .filter(product => {
      // Exclude products already in the order
      if (orderProductIds.has(product.id?.toString())) {
        return false;
      }
      // Exclude explicitly excluded products
      if (excludeProductIds.has(product.id?.toString())) {
        return false;
      }
      return true;
    })
    .map(product => {
      let score = 0;
      const scoreDetails = [];

      // 1. Same vendor/brand (+10 points)
      const orderVendors = new Set(orderProducts.map(p => p.vendor).filter(Boolean));
      if (orderVendors.has(product.vendor)) {
        score += 10;
        scoreDetails.push('same_vendor');
      }

      // 2. Same product type/category (+15 points)
      if (product.product_type && orderCategories.has(product.product_type)) {
        score += 15;
        scoreDetails.push('same_category');
      }

      // 3. Complementary tags (+5 points per matching tag, max 20)
      const productTags = new Set(product.tags || []);
      let matchingTags = 0;
      for (const tag of productTags) {
        if (orderTags.has(tag)) {
          matchingTags++;
        }
      }
      const tagScore = Math.min(matchingTags * 5, 20);
      if (tagScore > 0) {
        score += tagScore;
        scoreDetails.push('matching_tags');
      }

      // 4. Price optimization: slightly higher priced (+10 points)
      // Products 1.2x - 3x the average order price perform best
      const orderTotal = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const orderItemCount = orderProducts.reduce((sum, p) => sum + p.quantity, 0);
      const avgItemPrice = orderItemCount > 0 ? orderTotal / orderItemCount : orderTotal;
      
      if (product.price > avgItemPrice) {
        const priceRatio = product.price / avgItemPrice;
        if (priceRatio >= 1.2 && priceRatio <= 3) {
          score += 10;
          scoreDetails.push('optimal_price_range');
        } else if (priceRatio < 1.2) {
          score += 3; // Slightly higher
        }
        // > 3x gets no bonus
      }

      // 5. Inventory availability (+5 points if in stock)
      if (product.inventory > 0) {
        score += 5;
        scoreDetails.push('in_stock');
      }

      // 6. Has image (+3 points)
      if (product.image) {
        score += 3;
        scoreDetails.push('has_image');
      }

      return {
        ...product,
        score,
        score_details: scoreDetails,
        match_reasons: generateMatchReasons(scoreDetails, product, orderProducts)
      };
    });

  // Sort by score descending
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts;
}

/**
 * Generate human-readable match reasons
 */
function generateMatchReasons(scoreDetails, product, orderProducts) {
  const reasons = [];

  if (scoreDetails.includes('same_vendor')) {
    reasons.push(`Same brand as items in your order (${product.vendor})`);
  }
  if (scoreDetails.includes('same_category')) {
    reasons.push(`Same category as your order`);
  }
  if (scoreDetails.includes('matching_tags')) {
    reasons.push(`Frequently bought together`);
  }
  if (scoreDetails.includes('optimal_price_range')) {
    reasons.push(`Great value at $${product.price.toFixed(2)}`);
  }
  if (scoreDetails.includes('in_stock')) {
    reasons.push(`Available now`);
  }

  return reasons;
}

/**
 * Get the best upsell product for an offer
 * 
 * @param {Array} orderProducts - Products from the order
 * @param {Object} offer - The offer
 * @param {string} shopDomain - Shop domain
 * @returns {Object|null} Best upsell product or null
 */
export async function getBestUpsellProduct(orderProducts, offer, shopDomain) {
  // Get the product IDs configured in the offer
  const productConfig = typeof offer.product_config === 'string' 
    ? JSON.parse(offer.product_config) 
    : offer.product_config;
  
  let productIds = productConfig.product_ids || [];
  
  // If no specific products configured, get all products (for AI matching)
  if (productIds.length === 0) {
    // For now, search for commonly co-purchased products
    // In production, this would use Shopify's commerce formulas API
    const searchTerms = orderProducts
      .slice(0, 3)
      .map(p => `${p.product_type} ${p.vendor}`)
      .filter(Boolean)
      .join(' ');
    
    const searchResults = await searchProducts(searchTerms, shopDomain, 20);
    productIds = searchResults.map(p => p.id);
  }
  
  // Get product details
  const products = await getProductDetails(productIds, shopDomain);
  
  // Score and rank
  const rankedProducts = matchUpsellProducts(orderProducts, offer, products);
  
  // Return top result if available and in stock
  const inStock = rankedProducts.find(p => p.inventory > 0);
  return inStock || rankedProducts[0] || null;
}

/**
 * Calculate upsell price based on pricing strategy
 * 
 * @param {number} originalPrice - Original product price
 * @param {Object} pricingConfig - Pricing configuration from offer
 * @returns {number} The upsell price
 */
export function calculateUpsellPrice(originalPrice, pricingConfig) {
  if (!pricingConfig) {
    return originalPrice;
  }

  const { pricing_type, discount_value, discount_percentage } = pricingConfig;

  switch (pricing_type) {
    case 'percentage_off':
      return originalPrice * (1 - (discount_percentage || 10) / 100);
    
    case 'fixed_discount':
      return Math.max(0, originalPrice - (discount_value || 0));
    
    case 'cost_plus':
      // Markup percentage on cost (cost = originalPrice / 2 in most cases)
      const cost = originalPrice / 2;
      const markup = (discount_percentage || 30) / 100;
      return cost * (1 + markup);
    
    case 'bundle_price':
      // Fixed bundle price
      return discount_value || originalPrice;
    
    case 'fixed_price':
      // Set a fixed price
      return discount_value || originalPrice;
    
    default:
      return originalPrice;
  }
}

// ============================================
// TARGETING FUNCTIONS
// ============================================

/**
 * Search products for targeting in offer builder
 * Returns products in format: { id, title, vendor, product_type, image, variants: [{id, title, price}] }
 */
export async function searchProductsForTargeting(query, storeDomain, limit = 20) {
  try {
    const store = getStore(storeDomain);
    if (!store) {
      throw new Error(`Store not found: ${storeDomain}`);
    }

    const data = await shopifyGraphQL(
      storeDomain,
      store.access_token,
      PRODUCTS_SEARCH_QUERY,
      { query, first: limit }
    );

    if (!data.products) {
      return [];
    }

    const products = data.products.edges.map(({ node }) => {
      const firstVariant = node.variants?.edges?.[0]?.node;
      const firstImage = node.images?.edges?.[0]?.node;
      
      return {
        id: node.id,
        title: node.title,
        vendor: node.vendor,
        product_type: node.productType,
        image: firstImage?.url || null,
        variants: node.variants?.edges?.map(({ node: variant }) => ({
          id: variant.id,
          title: variant.title,
          price: parseFloat(variant.price)
        })) || []
      };
    });

    return products;
  } catch (error) {
    console.error(`[ProductService] searchProductsForTargeting error:`, error);
    throw error;
  }
}

/**
 * Get collections for targeting in offer builder
 * Returns collections in format: { id, title }
 */
export async function getCollectionsForTargeting(storeDomain) {
  try {
    const store = getStore(storeDomain);
    if (!store) {
      throw new Error(`Store not found: ${storeDomain}`);
    }

    const COLLECTIONS_QUERY = `
      query collections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL(
      storeDomain,
      store.access_token,
      COLLECTIONS_QUERY,
      { first: 250 }
    );

    if (!data.collections) {
      return [];
    }

    const collections = data.collections.edges.map(({ node }) => ({
      id: node.id,
      title: node.title
    }));

    return collections;
  } catch (error) {
    console.error(`[ProductService] getCollectionsForTargeting error:`, error);
    throw error;
  }
}

/**
 * Get customer tags for targeting in offer builder
 * Returns tags in format: { name, count }
 * Gets tags from past orders' customers
 */
export async function getCustomerTagsForTargeting(storeDomain) {
  try {
    const store = getStore(storeDomain);
    if (!store) {
      throw new Error(`Store not found: ${storeDomain}`);
    }

    // Query customers to aggregate tags from their orders
    const CUSTOMER_TAGS_QUERY = `
      query customerTags($first: Int!) {
        customers(first: $first) {
          edges {
            node {
              tags
              orders(first: 1) {
                edges {
                  node {
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyGraphQL(
      storeDomain,
      store.access_token,
      CUSTOMER_TAGS_QUERY,
      { first: 250 }
    );

    if (!data.customers) {
      return [];
    }

    // Aggregate tags with counts
    const tagCounts = {};
    
    data.customers.edges.forEach(({ node }) => {
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Convert to array format and sort by count descending
    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return tags;
  } catch (error) {
    console.error(`[ProductService] getCustomerTagsForTargeting error:`, error);
    throw error;
  }
}

export default {
  fetchOrderProducts,
  getProductDetails,
  searchProducts,
  matchUpsellProducts,
  getBestUpsellProduct,
  calculateUpsellPrice,
  searchProductsForTargeting,
  getCollectionsForTargeting,
  getCustomerTagsForTargeting
};
