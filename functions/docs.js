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
    "description": "E-commerce backend API with authentication"
  },
  "servers": [
    {
      "url": "/.netlify/functions",
      "description": "Netlify Functions"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "description": "Firebase ID token"
      }
    }
  },
  "paths": {
    "/products": {
      "get": {
        "summary": "Get all products",
        "responses": {
          "200": {
            "description": "List of products",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "string" },
                      "name": { "type": "string" },
                      "image": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create product",
        "security": [{ "DevAuth": [] }, { "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title", "description", "actual_price", "discounted_price"],
                "properties": {
                  "title": { "type": "string" },
                  "description": { "type": "string" },
                  "actual_price": { "type": "number" },
                  "discounted_price": { "type": "number" }
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Product created" },
          "400": { "description": "Missing required fields" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/cart": {
      "get": {
        "summary": "Get user cart",
        "security": [{ "DevAuth": [] }, { "BearerAuth": [] }],
        "responses": {
          "200": { "description": "Cart ID" },
          "404": { "description": "Cart not found" },
          "401": { "description": "Unauthorized" }
        }
      },
      "post": {
        "summary": "Create cart",
        "security": [{ "DevAuth": [] }, { "BearerAuth": [] }],
        "responses": {
          "201": { "description": "Cart created" },
          "409": { "description": "Cart already exists" },
          "401": { "description": "Unauthorized" }
        }
      }
    },
    "/config": {
      "get": {
        "summary": "Get all config values",
        "responses": {
          "200": { "description": "Config values" }
        }
      },
      "post": {
        "summary": "Create config value",
        "security": [{ "DevAuth": [] }, { "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["key", "value"],
                "properties": {
                  "key": { "type": "string" },
                  "value": {}
                }
              }
            }
          }
        },
        "responses": {
          "201": { "description": "Config created" },
          "409": { "description": "Key already exists" },
          "401": { "description": "Unauthorized" }
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
