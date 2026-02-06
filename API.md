# Backend API Schema

This document outlines the API endpoints, expected request bodies, and response structures for the frontend integration.

Base URL: `http://localhost:4000/api`

## Authentication (`/auth`)

### Sign Up
- **Endpoint**: `POST /auth/signup`
- **Request Body**:
  ```json
  {
      "fullName": "John Doe",
      "email": "john@example.com",
      "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
      "_id": "user_id_string",
      "fullName": "John Doe",
      "email": "john@example.com",
      "token": "jwt_token_string"
  }
  ```

### Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
      "email": "john@example.com",
      "password": "password123"
  }
  ```
- **Response**: Same as Sign Up.

---

## Payments (`/payment`)

### Initiate Payment
- **Endpoint**: `POST /payment/initiate`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
      "amount": 5000,
      "currency": "GHS"
  }
  ```
- **Response**:
  ```json
  {
      "message": "Payment initiated",
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "code",
      "reference": "REF-..."
  }
  ```

### Verify Payment
- **Endpoint**: `GET /payment/verify/:reference`
- **Response**:
  ```json
  {
      "status": "success",
      "message": "Payment verified successfully",
      "data": {
          "id": "payment_id",
          "status": "success",
          "amount": 5000,
          ...
      }
  }
  ```

---

## Risk Assessment (`/risk`)

### Assess Risk
- **Endpoint**: `POST /risk`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
      "location": "Coastal Region",
      "assetValue": 1000000,
      "propertyType": "wood" // or "concrete", etc.
  }
  ```
- **Response**:
  ```json
  {
      "message": "Risk assessment completed",
      "data": {
          "id": "assessment_id",
          "riskScore": 70, // 0-100
          "analysis": "High Risk",
          ...
      }
  }
  ```

---

## Predictions (`/predictions`)

### Disaster Prediction
- **Endpoint**: `POST /predictions`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
      "region": "Accra",
      "timeframe": "week" // "week" | "month" | "year"
  }
  ```
- **Response**:
  ```json
  {
      "message": "Disaster prediction analysis",
      "data": {
          "region": "Accra",
          "probabilityOfFlood": 45.5,
          "probabilityOfFire": 12.0,
          "alertLevel": "NORMAL", // "HIGH" | "NORMAL"
          "recommendation": "ensure..."
      }
  }
  ```
  