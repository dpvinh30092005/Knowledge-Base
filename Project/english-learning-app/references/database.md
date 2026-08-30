# Database Design

**Database Name:** `english_learning_app`

---

## Tables

### `vocabularies`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | Primary Key, Identity |
| `word` | NVARCHAR(255) | Not Null, Unique |
| `meaning` | NVARCHAR(MAX) | Not Null |
| `created_at` | DATETIME | Default: GETDATE() |

### `sentences`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | INT | Primary Key, Identity |
| `vocabulary_id` | INT | Foreign Key (vocabularies.id) |
| `content` | NVARCHAR(MAX) | Not Null |
| `source` | NVARCHAR(255) | Nullable |
| `created_at` | DATETIME | Default: GETDATE() |

---

## Naming Conventions
* **Tables:** `snake_case`, plural (e.g., `vocabularies`).
* **Columns:** `snake_case` (e.g., `created_at`).
* **Relationships:** One-to-Many (Vocabulary $\rightarrow$ Sentences).