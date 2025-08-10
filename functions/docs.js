const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const openApiSpec = {
  "openapi": "3.0.0",
  "info": {
    "title": "AJIO Clone API",
    "version": "1.0.0",
    "description": "E-commerce backend API with Firebase authentication"
  },
  "servers": [
    {
      "url": "https://ajio-backend-api.netlify.app/.netlify/functions",
      "description": "Production"
    },
    {
      "url": "http://localhost:8888/.netlify/functions",
      "description": "Development"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "description": "Firebase JWT token"
      }
    }
  },
  "paths": {
    "/products": {
      "get": {
        "summary": "Get products with optional filtering",
        "parameters": [
          {
            "name": "category",
            "in": "query",
            "schema": { "type": "string", "enum": ["men", "women", "kids"] }
          },
          {
            "name": "subcategory", 
            "in": "query",
            "schema": { "type": "string", "enum": ["clothing", "shoes", "accessories"] }
          },
          {
            "name": "id",
            "in": "query",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Products list or single product" }
        }
      }
    },
    "/cart": {
      "get": {
        "summary": "Get user cart or cart items",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "schema": { "type": "string" },
            "description": "Cart ID to get items"
          }
        ],
        "responses": {
          "200": { "description": "Cart ID or cart items" },
          "401": { "description": "Unauthorized" }
        }
      },
      "post": {
        "summary": "Create new cart",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "201": { "description": "Cart created" },
          "401": { "description": "Unauthorized" }
        }
      },
      "put": {
        "summary": "Update cart item",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "productId": { "type": "string" },
                  "quantity": { "type": "integer" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Cart updated" },
          "401": { "description": "Unauthorized" }
        }
      },
      "delete": {
        "summary": "Remove item from cart",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "productId",
            "in": "query", 
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Item removed" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/orders": {
      "get": {
        "summary": "Get user order history",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "List of orders" },
          "401": { "description": "Unauthorized" }
        }
      },
      "post": {
        "summary": "Create new order",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "items": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "product_id": { "type": "string" },
                        "quantity": { "type": "integer" },
                        "price": { "type": "number" }
                      }
                    }
                  },
                  "total_amount": { "type": "number" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Order created" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/profile": {
      "get": {
        "summary": "Get user profile",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": { "description": "User profile data" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/config": {
      "get": {
        "summary": "Get configuration value",
        "parameters": [
          {
            "name": "key",
            "in": "query",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Configuration value" }
        }
      }
    }
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(openApiSpec)
  };
};
