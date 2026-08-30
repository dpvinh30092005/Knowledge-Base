# System Architecture

## Layer Structure
**UI (FXML)** $\rightarrow$ **Controller** $\rightarrow$ **Service** $\rightarrow$ **DAO** $\rightarrow$ **Database**

---

## Layer Responsibilities

### UI (FXML)
* Defines layout and visual components.
* Strictly declarative; no logic.

### Controller
* Handles user events (button clicks, input).
* Manages UI state and data binding.
* **Allowed Data:** DTOs only.

### Service
* Orchestrates business logic.
* Performs Model $\leftrightarrow$ DTO conversion.
* **Allowed Data:** Models and DTOs.

### DAO (Data Access Object)
* Executes SQL queries via `PreparedStatement`.
* Maps `ResultSet` to Model objects.
* **Allowed Data:** Models only.

---

## Dependency Rules
* **Allowed:**
    * Controller calls Service.
    * Service calls DAO.
* **Forbidden:**
    * Controller calling DAO directly.
    * DAO using DTOs.
    * UI/Controller using Models.
    * Logic inside the Controller (must move to Service).
    * SQL queries outside the DAO.