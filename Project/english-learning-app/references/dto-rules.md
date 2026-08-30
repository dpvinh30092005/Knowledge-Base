# DTO (Data Transfer Object) Rules

## Usage
* Used for passing data between the **Service** and **Controller/UI**.
* Decouples the UI from the database schema.

---

## Field Rules
* **Allowed:**
    * Only fields required for display (e.g., `word`, `meaning`).
    * List of strings or nested DTOs for related data.
    * `id` only if the UI needs it for selection/deletion.
* **Forbidden:**
    * No database-only metadata (e.g., `internal_log_id`).
    * No `java.sql` types.
    * No business logic or methods other than getters.

---

## Mapping Rules (Model ↔ DTO)
* **Location:** Mapping must occur **strictly** within the **Service** layer.
* **Model to DTO:** DAO returns Model $\rightarrow$ Service converts to DTO $\rightarrow$ Controller receives DTO.
* **DTO to Model:** Controller passes DTO $\rightarrow$ Service converts to Model $\rightarrow$ DAO receives Model.

---

## Constraints
* **Immutability:** Use `final` fields and constructor-based injection.
* **Structure:** Must be simple POJOs or Java Records.