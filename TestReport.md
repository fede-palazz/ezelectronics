# Test Report

The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover.

# Contents

- [Test Report](#test-report)
- [Contents](#contents)
- [Dependency graph](#dependency-graph)
- [Integration approach](#integration-approach)
- [Tests](#tests)
  - [User Unit Tests](#user-unit-tests)
  - [Cart Unit Tests](#cart-unit-tests)
  - [Cart Integration Tests](#cart-integration-tests)
- [Coverage](#coverage)
  - [Coverage of FR](#coverage-of-fr)
  - [Coverage white box](#coverage-white-box)

# Dependency graph

![dependency_graph](Immagini/dependency_graph.png)

# Integration approach

    L'approccio di testing utilizzato è di tipo bottom up, cominciando a testare i singoli moduli dal basso verso l'alto per poi testare il livello API.
    
    La sequenza di testing è stata:
    - step1: unit DAO
    - step2: unit Controller
    - step3: unit Routes
    - step4: integration Routes (API testing)

# Tests

## User Unit Tests

|     Test case name      | Object(s) tested | Test level | Technique used |
| :---------------------: | :--------------: | :--------: | :------------: |
|   User authentication   |     UserDAO      |    Unit    |       WB       |
|     Create account      |     UserDAO      |    Unit    |       WB       |
|  Get user by username   |     UserDAO      |    Unit    |       WB       |
|      Get all users      |     UserDAO      |    Unit    |       WB       |
|    Get users by role    |     UserDAO      |    Unit    |       WB       |
| Delete user by username |     UserDAO      |    Unit    |       WB       |
|    Delete all users     |     UserDAO      |    Unit    |       WB       |
|    Update user info     |     UserDAO      |    Unit    |       WB       |
|                         |                  |            |                |
|     Create new user     |  UserController  |    Unit    |       WB       |
|        Get users        |  UserController  |    Unit    |       WB       |
|    Get users by role    |  UserController  |    Unit    |       WB       |
|  Get user by username   |  UserController  |    Unit    |       WB       |
| Delete user by username |  UserController  |    Unit    |       WB       |
|    Delete all users     |  UserController  |    Unit    |       WB       |
| Update user information |  UserController  |    Unit    |       WB       |
|                         |                  |            |                |
|         POST /          |    UserRoutes    |    Unit    |       WB       |
|          GET /          |    UserRoutes    |    Unit    |       WB       |
|    GET /roles/:role     |    UserRoutes    |    Unit    |       WB       |
|     GET /:username      |    UserRoutes    |    Unit    |       WB       |
|    DELETE /:username    |    UserRoutes    |    Unit    |       WB       |
|        DELETE /         |    UserRoutes    |    Unit    |       WB       |
|    PATCH /:username     |    UserRoutes    |    Unit    |       WB       |

## User Integration Tests

|      Test case name      | Object(s) tested | Test level | Technique used |
| :----------------------: | :--------------: | :--------: | :------------: |
|       POST /users        |    UserRoutes    |    API     |       BB       |
| DELETE /sessions/current |    UserRoutes    |    API     |       BB       |
|      POST /sessions      |    UserRoutes    |    API     |       BB       |
|        GET /users        |    UserRoutes    |    API     |       BB       |
|  GET /users/roles/:role  |    UserRoutes    |    API     |       BB       |
|   GET /users/:username   |    UserRoutes    |    API     |       BB       |
|  PATCH /users/:username  |    UserRoutes    |    API     |       BB       |
| DELETE /users/:username  |    UserRoutes    |    API     |       BB       |
|      DELETE /users       |    UserRoutes    |    API     |       BB       |

## Cart Unit Tests

|   Test case name    | Object(s) tested | Test level |     Technique used     |
| :-----------------: | :--------------: | :--------: | :--------------------: |
| Cart creation and visualization |     CartDAO      |    Unit    | WB |
| Create empty cart |     CartDAO      |    Unit    | WB |
| Get current cart |     CartDAO      |    Unit    | WB |
| Add product to cart |     CartDAO      |    Unit    | WB |
| Remove product from cart |     CartDAO      |    Unit    | WB |
| Modify product quantity in cart |     CartDAO      |    Unit    | WB |
| Get paid carts |     CartDAO      |    Unit    | WB |
| Delete all carts |     CartDAO      |    Unit    | WB |
| Get all carts |     CartDAO      |    Unit    | WB |
| Delete all products from a cart |     CartDAO      |    Unit    | WB |
| Check availability of a product in cart |     CartDAO      |    Unit    | WB |
| Checkout current cart |     CartDAO      |    Unit    | WB |
| | | ||
| Add to cart |     CartController      |    Unit    | WB |
| Get cart |     CartController      |    Unit    | WB |
| Checkout cart |     CartController      |    Unit    | WB |
| Get customer carts |     CartController      |    Unit    | WB |
| Remove product from cart |     CartController      |    Unit    | WB |
| Clear cart |     CartController      |    Unit    | WB |
| Delete all carts |     CartController      |    Unit    | WB |
| Get all carts |     CartController      |    Unit    | WB |
| | | ||
| GET / | CartRoutes | Unit | WB |
| POST / | CartRoutes | Unit | WB |
| PATCH / | CartRoutes | Unit | WB |
| GET /history | CartRoutes | Unit | WB |
| DELETE /products/:model | CartRoutes | Unit | WB |
| DELETE /current | CartRoutes | Unit | WB |
| DELETE / | CartRoutes | Unit | WB |
| GET /all | CartRoutes | Unit | WB |

## Cart Integration Tests

|   Test case name    | Object(s) tested | Test level |     Technique used     |
| :-----------------: | :--------------: | :--------: | :--------------------: |
| GET /ezelectronics/carts |     CartRoutes     |    API    | BB |
| GET /ezelectronics/carts/history |     CartRoutes     |    API    | BB |
| POST /ezelectronics/carts |     CartRoutes     |    API    | BB |
| PATCH /ezelectronics/carts |     CartRoutes     |    API    | BB |
| DELETE /ezelectronics/carts/products/:model |     CartRoutes     |    API    | BB |
| DELETE /ezelectronics/carts/current |     CartRoutes     |    API    | BB |
| GET /ezelectronics/carts/all |     CartRoutes     |    API    | BB |
| DELETE /ezelectronics/carts |     CartRoutes     |    API    | BB |

## Product Unit Tests

|           Test case name           | Object(s) tested  | Test level | Technique used |
| :--------------------------------: | :---------------: | :--------: | :------------: |
|          Register product          |    ProductDAO     |    Unit    |       WB       |
|      Change product quantity       |    ProductDAO     |    Unit    |       WB       |
|            Sell product            |    ProductDAO     |    Unit    |       WB       |
|            Get products            |    ProductDAO     |    Unit    |       WB       |
|      Get products by category      |    ProductDAO     |    Unit    |       WB       |
|       Get available products       |    ProductDAO     |    Unit    |       WB       |
| Get available products by category |    ProductDAO     |    Unit    |       WB       |
|            Get product             |    ProductDAO     |    Unit    |       WB       |
|           Delete product           |    ProductDAO     |    Unit    |       WB       |
|        Delete all products         |    ProductDAO     |    Unit    |       WB       |
|                                    |                   |            |                |
|         Register products          | ProductController |    Unit    |       WB       |
|      Change product quantity       | ProductController |    Unit    |       WB       |
|            Sell product            | ProductController |    Unit    |       WB       |
|            Get products            | ProductController |    Unit    |       WB       |
|       Get available products       | ProductController |    Unit    |       WB       |
|        Delete all products         | ProductController |    Unit    |       WB       |
|           Delete product           | ProductController |    Unit    |       WB       |
|                                    |                   |            |                |
|               POST /               |   ProductRoutes   |    Unit    |       WB       |
|           PATCH /:model            |   ProductRoutes   |    Unit    |       WB       |
|         PATCH /:model/sell         |   ProductRoutes   |    Unit    |       WB       |
|               GET /                |   ProductRoutes   |    Unit    |       WB       |
|           GET /available           |   ProductRoutes   |    Unit    |       WB       |
|              DELETE /              |   ProductRoutes   |    Unit    |       WB       |
|           DELETE /:model           |   ProductRoutes   |    Unit    |       WB       |

## Product Integration Tests

|       Test case name        | Object(s) tested | Test level | Technique used |
| :-------------------------: | :--------------: | :--------: | :------------: |
|       POST /products        |  ProductRoutes   |    API     |       BB       |
|        GET /products        |  ProductRoutes   |    API     |       BB       |
|   PATCH /products/:model    |  ProductRoutes   |    API     |       BB       |
| PATCH /products/:model/sell |  ProductRoutes   |    API     |       BB       |
|   GET /products/available   |  ProductRoutes   |    API     |       BB       |
|   DELETE /products/:model   |  ProductRoutes   |    API     |       BB       |

## Review Unit Tests

|       Test case name       | Object(s) tested | Test level | Technique used |
| :------------------------: | :--------------: | :--------: | :------------: |
|    Review registration     |    ReviewDAO     |    Unit    |       WB       |
|  Get reviews of a product  |    ReviewDAO     |    Unit    |       WB       |
|       Delete review        |    ReviewDAO     |    Unit    |       WB       |
| Delete reviews of product  |    ReviewDAO     |    Unit    |       WB       |
|     Delete all reviews     |    ReviewDAO     |    Unit    |       WB       |
|                            |                  |            |                |
|     Create new review      | ReviewController |    Unit    |       WB       |
|    Get product reviews     | ReviewController |    Unit    |       WB       |
|       Delete review        | ReviewController |    Unit    |       WB       |
| Delete reviews of product  | ReviewController |    Unit    |       WB       |
|     Delete all reviews     | ReviewController |    Unit    |       WB       |
|                            |                  |            |                |
|    POST /reviews/:model    |   ReviewRoutes   |    Unit    |       WB       |
|    GET /reviews/:model     |   ReviewRoutes   |    Unit    |       WB       |
|   DELETE /reviews/:model   |   ReviewRoutes   |    Unit    |       WB       |
| DELETE /reviews/:model/all |   ReviewRoutes   |    Unit    |       WB       |
|      DELETE /reviews       |   ReviewRoutes   |    Unit    |       WB       |

## Review Integration Tests

|       Test case name       | Object(s) tested | Test level | Technique used |
| :------------------------: | :--------------: | :--------: | :------------: |
|    POST /reviews/:model    |   ReviewRoutes   |    API     |       BB       |
|   DELETE /reviews/:model   |   ReviewRoutes   |    API     |       BB       |
|    GET /reviews/:model     |   ReviewRoutes   |    API     |       BB       |
| DELETE /reviews/:model/all |   ReviewRoutes   |    API     |       BB       |
|      DELETE /reviews       |   ReviewRoutes   |    API     |       BB       |

# Coverage

## Coverage of FR

| Functional Requirement or scenario | Test(s) |
| :--------------------------------- | :------ |
|               FR1.1 - Login               | POST /ezelectronics/sessions |
|               FR1.2 - Logout               | DELETE /ezelectronics/sessions/current |
|               FR1.3 - Create a new user account               | POST /ezelectronics/users |
|               FR2.1 - Show the list of all users               | GET /ezelectronics/users |
|               FR2.2 - Show the list of all users with a specific role               | GET /ezelectronics/users/roles/:role |
|               FR2.3 - Show the information of a single user               | GET /ezelectronics/users/:username |
|               FR2.4 - Update the information of a single user               | PATCH /ezelectronics/users/:username |
|               FR2.5 - Delete a single *non Admin* user               | DELETE /ezelectronics/users/:username |
|               FR2.6 - Delete all *non Admin* users               | DELETE /ezelectronics/users |
|               FR3.1 - Register a set of new products               | POST /ezelectronics/products |
|               FR3.2 - Update the quantity of a product               | PATCH /ezelectronics/products/:model |
|               FR3.3 - Sell a product               | PATCH /ezelectronics/products/:model/sell |
|               FR3.4 - Show the list of all products               | GET /ezelectronics/products |
|              FR3.4.1 - Show the list of all available products              | GET /ezelectronics/products/available |
|               FR3.5 - Show the list of all products with the same category               | GET /ezelectronics/products |
|              FR3.5.1 - Show the list of all available products with the same category              | GET /ezelectronics/products/available |
|               FR3.6 - Show the list of all products with the same model               | GET /ezelectronics/products |
|              FR3.6.1 - Show the list of all available products with the same model              | GET /ezelectronics/products/available |
|               FR3.7 - Delete a product               | DELETE /ezelectronics/products/:model |
|               FR3.8 - Delete all products               | DELETE /ezelectronics/products |
|               FR4.1 - Add a new review to a product               | POST /ezelectronics/reviews/:model |
|               FR4.2 - Get the list of all reviews assigned to a product               | GET /ezelectronics/reviews/:model |
|               FR4.3 - Delete a review given to a product               | DELETE /ezelectronics/reviews/:model |
|               FR4.4 - Delete all reviews of a product               | DELETE /ezelectronics/reviews/:model/all |
|               FR4.5 - Delete all reviews of all products               | DELETE /ezelectronics/reviews |
|               FR5.1 - Show the information of the current cart               |  GET /ezelectronics/carts        |
|               FR5.2 - Add a product to the current cart               | POST /ezelectronics/carts        |
|               FR5.3 - Checkout the current cart               | PATCH /ezelectronics/carts        |
|               FR5.4 - Show the history of the paid carts               | GET /ezelectronics/carts/history        |
|               FR5.5 - Remove a product from the current cart               | DELETE /ezelectronics/carts/products/:model        |
|               FR5.6 - Delete the current cart               | DELETE /ezelectronics/carts/current        |
|               FR5.7 - See the list of all carts of all users               | GET /ezelectronics/carts/all         |
|               FR5.8 - Delete all carts               | DELETE /ezelectronics/carts         |

## Coverage white box

![coverage](Immagini/coverage.png)
