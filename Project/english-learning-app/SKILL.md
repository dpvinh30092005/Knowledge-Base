# Skill: English Learning App Development (JavaFX & Layered Architecture)

## Description
Expertise in building and maintaining a JavaFX desktop application for English vocabulary learning. This skill focuses on a strict layered architecture (UI, ViewModel, Service, DAO) using SQL Server, ensuring a clean separation between data transfer objects (DTOs) and database entities (Models).

---

## Architecture Overview

The application follows a one-way dependency flow to ensure maintainability and testability:

**UI** $\rightarrow$ **ViewModel** $\rightarrow$ **Service** $\rightarrow$ **DAO** $\rightarrow$ **Database**

### Layer Responsibilities

| Layer | Primary Responsibility | Data Handled |
| :--- | :--- | :--- |
| **UI (View)** | FXML and Controllers; renders data and captures input. | DTO only |
| **ViewModel** | Manages UI state and logic using JavaFX Properties. | DTO only |
| **Service** | Orchestrates business logic and performs Model $\leftrightarrow$ DTO mapping. | Model & DTO |
| **DAO** | Executes SQL queries and handles raw database interactions. | Model only |
| **Model (Entity)** | Represents the database schema/table structure. | DB Fields |
| **DTO** | Lightweight objects optimized for UI display. | UI Fields |

---

## Data Flow Patterns

### Read Operations
1. **DAO** fetches data from **SQL Server** and maps it to a **Model**.
2. **Service** receives the **Model**, applies logic, and converts it to a **DTO**.
3. **ViewModel** holds the **DTO** in a `Property`.
4. **UI** binds to the **ViewModel** to display the information.

### Write Operations
1. **UI** collects input into a **DTO**.
2. **Service** validates the **DTO** and converts it into a **Model**.
3. **DAO** receives the **Model** and executes a `PreparedStatement`.
4. **Database** persists the changes.

---

## Strict Implementation Rules

### 1. DTO (Data Transfer Object)
* **Purpose:** To decouple the UI from the database schema.
* **Constraints:**
    * Must be immutable (use `final` fields).
    * No business logic or database-specific metadata (e.g., internal IDs or timestamps) unless explicitly required by the UI.
    * **Example:** `VocabularyDTO` should contain `word`, `meaning`, and `List<String> sentences`.

### 2. DAO (Data Access Object)
* **Purpose:** Isolated database communication.
* **Constraints:**
    * Use `PreparedStatement` to prevent SQL injection.
    * **Never** use DTOs; only interact with Model entities.
    * No business logic allowed.

### 3. Service Layer
* **Purpose:** The "Brain" of the application.
* **Constraints:**
    * The only layer allowed to convert between Models and DTOs.
    * **Never** contain SQL queries or direct UI manipulation.
    * Must return DTOs to the caller (ViewModel).

---

## Database Schema

**Database Name:** `english_learning_app`

### Tables
* **`vocabularies`**: `id` (PK), `word`, `meaning`, `created_at`
* **`sentences`**: `id` (PK), `vocabulary_id` (FK), `content`, `source`, `created_at`

---

## Development Constraints

> [!IMPORTANT]
> * **No Logic in Controllers:** Controllers should only delegate to ViewModels.
> * **Model Isolation:** The UI layer must never have access to or knowledge of the Model (Entity) classes.
> * **SQL Isolation:** SQL code is strictly forbidden outside of the DAO layer.
> * **Naming:** Use `snake_case` for database objects and `camelCase`/`PascalCase` for Java code.

---

## Agent Guidelines
* Prioritize simplicity and adhere strictly to the layered boundaries.
* When generating code, ensure `VocabularyDTO` and `VocabularyModel` remain distinct.
* Always use JavaFX Properties (e.g., `StringProperty`) in ViewModels for seamless UI binding.