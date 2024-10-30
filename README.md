
# Heartbeat Service

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Docker Support](#docker-support)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)

---

## Overview

The Heartbeat Service is a RESTful API designed to monitor active client applications through heartbeat signals. It tracks client statuses and removes those that become inactive, ensuring an up-to-date view of active services.

## Features

- **Client Status Monitoring**: Tracks clients that send periodic heartbeats.
- **Automatic Cleanup**: Removes clients inactive for a specified time.
- **Scalable Architecture**: Designed to be horizontally scalable.
- **Docker Support**: containerized redis container for easy setup.

## Project Structure

```
Heartbeat/
├── .env                                # Environment variables
├── docker-compose.yml                  # Docker configuration
├── package.json                        # Node.js dependencies
├── server.ts                           # Application entry point
├── tests/                              # Unit and integration tests
│    ├── e2e/                           # End to end testing
│    │    ├── e2e_flow.test.ts
│    ├── integration/                   # Integration testing
│    │    ├── endpoints.test.ts
│    ├── unit/                          # Unit testing
│    │    ├── heartbeat.test.ts
│    │    ├── middleware.test.ts
│    │    ├── redis.test.ts
└── src/                                # Core source code
    ├── api/
    │   ├── middleware.ts               # Middleware for request validation and logging
    │   └── router.ts                   # Route handling for heartbeat endpoints
    ├── heartbeat.ts                    # Core logic for heartbeat tracking
    └── redis.ts                        # Redis client setup and configuration
```

## Docker Support

This project requires a Redis connection to function correctly. For convenience, a Redis container is included in the docker-compose configuration. Running the command below will run the Redis container, allowing the project to operate seamlessly:

```bash
docker-compose up
```

## Installation

To set up the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/William-Daniels1995/heartbeat.git
   ```
   
2. Navigate to the project directory:
   ```bash
   cd heartbeat
   ```
   
3. Install dependencies:
   ```bash
   npm install
   ```
   
4. Start the service:
   ```bash
   npm start
   ```

## Environment Variables

#### Application Settings

- **PORT**  
  Specifies the port on which the application will run.  
  - **Example**: `PORT=3000`
  - **Default**: 3000 (if unspecified)

- **NODE_ENV**  
  Specifies the port on which the application will run.  
  - **Example**: `production`
  - **Default**: development (if unspecified)

- **EXPIRY_AGE**  
  Defines the age in milliseconds before a resource expires.  
  - **Example**: `EXPIRY_AGE=5000`

- **CLEANUP_INTERVAL**  
  Sets the interval in milliseconds at which the application performs cleanup operations.  
  - **Example**: `CLEANUP_INTERVAL=30000`

#### CORS Settings

- **CORS_ORIGIN**  
  Specifies the origin URL allowed for Cross-Origin Resource Sharing (CORS). This is necessary to allow or restrict requests from different domains.  
  - **Example**: `CORS_ORIGIN=http://localhost:3000`

#### Redis Configuration

- **REDIS_HOST_PROD**
  Defines the hostname or IP address of the production Redis server.  
  - **Example**: `REDIS_HOST=localhost`
  - **Default**: `localhost`

- **REDIS_HOST_TEST**
  Defines the hostname or IP address of the development Redis server.  
  - **Example**: `REDIS_HOST=localhost`
  - **Default**: `localhost`

- **REDIS_PORT**
  Sets the port on which the Redis server is listening.  
  - **Example**: `REDIS_PORT=6379`
  - **Default**: 6379

## Usage

Once started, the server will be accessible at `http://localhost:<PORT>`. The service monitors clients sending periodic heartbeat signals and automatically removes any client that fails to send a heartbeat within the defined time.

## Endpoints Overview

---

### 1. **GET /**

- **Description**: Retrieve all available groups.
- **Request**: `GET /`
- **Parameters**: None
- **Response**: JSON array with data on all groups.
- **Error Handling**: Returns `500` status code on internal error.

#### Example Request & Response
```http
GET / HTTP/1.1

[{
   "group": "exampleGroup",
   "instances": 4,
   "createdAt": 1571418096158,
   "updatedAt": 1571418124127
}]
```

---

### 2. **GET /:group**

- **Description**: Fetch details of a specific group.
- **Request**: `GET /:group`
- **URL Parameters**:
  - `group` (string, required): Identifier for the group.
- **Response**: JSON object containing data specific to the requested group.
- **Error Handling**:
  - `400 Bad Request`

#### Example Request & Response
```http
GET /exampleGroup HTTP/1.1

[{
   "id": "123e4567-e89b-12d3-a456-426614174000",
   "group": "exampleGroup",
   "createdAt": 1571418096158,
   "updatedAt": 1571418124127,
   "meta": { 
     "key": "value"
   }
}]
```

---

### 3. **POST /:group/:id**

- **Description**: Create or update an entry within a group.
- **Request**: `POST /:group/:id`
- **URL Parameters**:
  - `group` (string, required): Group identifier.
  - `id` (UUID, required): Unique identifier for the entry, validated as either UUID v4 or v5.
- **Body Parameters**:
  - `meta` (object, optional): Metadata for the entry.
- **Response**: JSON object with details of the created or updated entry.
- **Error Handling**:
  - `400 Bad Request`

#### Example Request & Response
```http
POST /exampleGroup/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
Content-Type: application/json

{
   "id": "123e4567-e89b-12d3-a456-426614174000",
   "group": "exampleGroup",
   "createdAt": 1571418096158,
   "updatedAt": 1571418124127,
   "meta": { 
     "key": "value"
   }
}
```

---

### 4. **DELETE /:group/:id**

- **Description**: Delete an entry within a specified group.
- **Request**: `DELETE /:group/:id`
- **URL Parameters**:
  - `group` (string, required): Group identifier.
  - `id` (UUID, required): Unique identifier for the entry.
- **Response**: JSON confirmation of deletion, or an error message if unsuccessful.
- **Error Handling**:
  - `400 Bad Request`

#### Example Request
```http
DELETE /exampleGroup/123e4567-e89b-12d3-a456-426614174000 HTTP/1.1
```

--- 

## Testing

### Run all tests sequentially
Runs tests sequentially to prevent port conflicts
```bash
npm run test
```

### Run only unit tests
```bash
npm run test:unit
```

### Run integration tests
```bash
npm run test:integration
```

### Run end-to-end tests
```bash
npm run test:e2e
```

Ensure that a Redis server is running during tests.

---
