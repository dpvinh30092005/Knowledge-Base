-- ============================================================
-- InteliPath local Docker database bootstrap
-- Runs once when the postgres_data volume is first created.
--
--   docker compose down -v
--   docker compose up --build
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Core lookup/profile tables
-- ============================================================

CREATE TABLE IF NOT EXISTS career_roles (
    career_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_name     VARCHAR(255) NOT NULL UNIQUE,
    prerequisite    JSONB,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS skills (
    skill_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category        VARCHAR(255),
    careers         JSONB,
    skill_name      VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    -- Login name for provisioned accounts (staff, FPT students); NULL for OAuth accounts.
    username        VARCHAR(100) UNIQUE,
    -- BCrypt hash; NULL for OAuth accounts, which have no local credential.
    password_hash   VARCHAR(100),
    full_name       VARCHAR(255),
    yob             DATE,
    bio             TEXT,
    avatar_url      TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    role            VARCHAR(30) NOT NULL DEFAULT 'STUDENT',
    account_status  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    account_type    VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    CONSTRAINT ck_users_role
        CHECK (role IN ('STUDENT', 'COUNSELOR', 'MENTOR', 'ADMIN')),
    CONSTRAINT ck_users_account_status
        CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT ck_users_account_type
        CHECK (account_type IN ('FPT', 'OTHER'))
);

CREATE TABLE IF NOT EXISTS students (
    user_id             UUID PRIMARY KEY,
    career_id           UUID,
    -- Free text, display only. FPT material access is decided by users.account_type.
    university_name     VARCHAR(255),
    admission_date      DATE,
    major               VARCHAR(255),
    github_profile      VARCHAR(255),
    transcript_url      TEXT,
    portfolio_slug      VARCHAR(100) NOT NULL UNIQUE,
    fpt_curriculum_id   UUID,
    -- GitHub "Sync" credentials, set only by the explicit Connect-GitHub link flow (not login).
    github_sync_token_enc TEXT,
    github_sync_scopes    VARCHAR(255),
    github_login          VARCHAR(255),
    CONSTRAINT fk_st_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_st_career
        FOREIGN KEY (career_id) REFERENCES career_roles (career_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS academic_counselor (
    user_id             UUID PRIMARY KEY,
    university_name     VARCHAR(255),
    department          VARCHAR(255),
    admission_date      DATE,
    CONSTRAINT fk_ac_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS industry_mentor (
    user_id        UUID PRIMARY KEY,
    company        VARCHAR(255),
    industry_focus VARCHAR(255),
    CONSTRAINT fk_im_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ============================================================
-- Skill / roadmap
-- ============================================================

CREATE TABLE IF NOT EXISTS career_required_skills (
    skill_required_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id         UUID NOT NULL,
    skill_id          UUID NOT NULL,
    importance_level  VARCHAR(20),
    CONSTRAINT uq_career_skill UNIQUE (career_id, skill_id),
    CONSTRAINT ck_crs_importance
        CHECK (importance_level IS NULL OR importance_level IN ('LOW', 'AVG', 'HIGH')),
    CONSTRAINT fk_crs_career
        FOREIGN KEY (career_id) REFERENCES career_roles (career_id) ON DELETE CASCADE,
    CONSTRAINT fk_crs_skill
        FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS node_types (
    type_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage               VARCHAR(30) NOT NULL DEFAULT 'FOUNDATION',
    unlock_key_required BOOLEAN,
    stage_unlock_key    JSONB,
    weight              INT,
    CONSTRAINT ck_node_types_stage
        CHECK (stage IN ('FOUNDATION', 'CORE', 'PRACTICAL', 'ADVANCED', 'JOB_READY'))
);

CREATE TABLE IF NOT EXISTS skill_nodes (
    node_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id            UUID NOT NULL,
    skill_id             UUID,
    type_id              UUID,
    previous_node        UUID,
    parent_node          UUID,
    prerequisite         JSONB,
    node_name            VARCHAR(255) NOT NULL,
    node_level           INT,
    description          TEXT,
    resource             JSONB,
    completion_policy    VARCHAR(50) DEFAULT 'NEVER_COMPLETE',
    selection            VARCHAR(20) DEFAULT 'ALL',
    choose_count         INT,
    node_kind            VARCHAR(20) DEFAULT 'CORE',
    axis                 VARCHAR(20) DEFAULT 'MAIN',
    is_optional          BOOLEAN DEFAULT FALSE,
    is_checkpoint        BOOLEAN DEFAULT FALSE,
    required_proficiency INT,
    evidence_keywords    JSONB,
    CONSTRAINT ck_skill_nodes_completion_policy
        CHECK (completion_policy IS NULL OR completion_policy IN ('NEVER_COMPLETE', 'MANUAL_ONLY', 'EVIDENCE_ALLOWED')),
    CONSTRAINT ck_skill_nodes_selection
        CHECK (selection IS NULL OR selection IN ('ALL', 'CHOOSE_ONE')),
    CONSTRAINT ck_skill_nodes_node_kind
        CHECK (node_kind IS NULL OR node_kind IN ('CORE', 'ALTERNATIVE', 'OPTIONAL')),
    CONSTRAINT ck_skill_nodes_axis
        CHECK (axis IS NULL OR axis IN ('MAIN', 'BRANCH')),
    CONSTRAINT fk_sn_career
        FOREIGN KEY (career_id) REFERENCES career_roles (career_id) ON DELETE CASCADE,
    CONSTRAINT fk_sn_skill
        FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE SET NULL,
    CONSTRAINT fk_sn_type
        FOREIGN KEY (type_id) REFERENCES node_types (type_id) ON DELETE SET NULL,
    CONSTRAINT fk_sn_previous_node
        FOREIGN KEY (previous_node) REFERENCES skill_nodes (node_id) ON DELETE SET NULL,
    CONSTRAINT fk_sn_parent_node
        FOREIGN KEY (parent_node) REFERENCES skill_nodes (node_id) ON DELETE SET NULL
);

-- ============================================================
-- Roadmap layout (presentation only)
-- ============================================================
-- Purely visual placement of a node on the roadmap canvas, edited by mentors.
-- Kept separate from skill_nodes so layout never influences unlock/progress
-- logic; the dynamic roadmap is still computed from parent/previous/
-- prerequisite/stage/student_progress. One row per node.

CREATE TABLE IF NOT EXISTS roadmap_node_layouts (
    layout_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id        UUID NOT NULL,
    position_x     DOUBLE PRECISION,
    position_y     DOUBLE PRECISION,
    lane           VARCHAR(50),
    display_order  INT,
    layout_version INT NOT NULL DEFAULT 1,
    edited_by      UUID,
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roadmap_node_layout UNIQUE (node_id),
    CONSTRAINT fk_rnl_node
        FOREIGN KEY (node_id) REFERENCES skill_nodes (node_id) ON DELETE CASCADE,
    CONSTRAINT fk_rnl_edited_by
        FOREIGN KEY (edited_by) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS student_skills (
    student_skill_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL,
    skill_id           UUID NOT NULL,
    custom_description TEXT,
    tech_stack         VARCHAR(255),
    CONSTRAINT uq_student_skill UNIQUE (user_id, skill_id),
    CONSTRAINT fk_ss_student
        FOREIGN KEY (user_id) REFERENCES students (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_skill
        FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_progress (
    progress_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    node_id      UUID NOT NULL,
    status       VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT uq_student_progress UNIQUE (user_id, node_id),
    CONSTRAINT ck_student_progress_status
        CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED')),
    CONSTRAINT fk_sp_student
        FOREIGN KEY (user_id) REFERENCES students (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_node
        FOREIGN KEY (node_id) REFERENCES skill_nodes (node_id) ON DELETE CASCADE
);

-- Which alternative a student picked inside a CHOOSE_ONE group. The roadmap
-- template is shared across all students; this per-student overlay records the
-- choice (e.g. "for Pick a Language, this student chose Java") so a Java student
-- is never forced to complete C#. One row per (student, group).
CREATE TABLE IF NOT EXISTS student_node_selections (
    selection_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    group_node_id  UUID NOT NULL,
    chosen_node_id UUID NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Who made the choice, and on what grounds. A branch the system picked for
    -- the student has to be able to say why, or it is indistinguishable from a
    -- decision they made and forgot -- and they can never argue with it.
    auto_selected  BOOLEAN NOT NULL DEFAULT FALSE,
    auto_reason    TEXT,
    CONSTRAINT uq_student_node_selection UNIQUE (user_id, group_node_id),
    CONSTRAINT fk_sns_student
        FOREIGN KEY (user_id) REFERENCES students (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sns_group
        FOREIGN KEY (group_node_id) REFERENCES skill_nodes (node_id) ON DELETE CASCADE,
    CONSTRAINT fk_sns_chosen
        FOREIGN KEY (chosen_node_id) REFERENCES skill_nodes (node_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skill_trends (
    trend_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id    UUID NOT NULL,
    jobs_needed INT,
    week_stamp  DATE,
    CONSTRAINT fk_strd_skill
        FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE CASCADE
);

-- ============================================================
-- Portfolio / mentor feedback
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_configs (
    config_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID UNIQUE NOT NULL,
    theme          VARCHAR(50) DEFAULT 'dark',
    theme_colors   JSONB,
    fonts          JSONB,
    hero_section   JSONB,
    skills_section JSONB,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pc_user
        FOREIGN KEY (user_id) REFERENCES students (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_education (
    education_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    university   VARCHAR(255) NOT NULL,
    degree       VARCHAR(255),
    period       VARCHAR(100),
    description  TEXT,
    CONSTRAINT fk_se_user
        FOREIGN KEY (user_id) REFERENCES students (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS portfolio_project (
    project_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    repo_id      BIGINT,
    repo_url     TEXT,
    project_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Project',
    demo_url     TEXT,
    icon         VARCHAR(100),
    description  TEXT,
    stars        INT DEFAULT 0,
    tech_stack   JSONB,
    CONSTRAINT fk_pp_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- What the AI read when it analysed a repository, and what it answered.
--
-- Importing a repository spends a model call and then rewrites the student's
-- profile: evidence appears, proficiency is promoted, roadmap nodes complete.
-- Without this the only record of how was a container log line, so an import
-- that matched nothing looked identical to one that matched everything.
--
-- Written once at analysis time and never updated. The accepted/rejected fate
-- of each matched skill is deliberately NOT stored here — it keeps moving in
-- student_skill_evidence, and a snapshot would end up contradicting the profile
-- it is supposed to explain.
CREATE TABLE IF NOT EXISTS github_import_audit (
    audit_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    repo_url       TEXT NOT NULL,
    repo_full_name TEXT,
    analyzed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    model          VARCHAR(100),
    -- AUTHENTICATED = the student's token via the Contents API (sees private repos);
    -- ANONYMOUS = raw.githubusercontent.com, where a private repo reads as empty.
    fetch_mode     VARCHAR(20),
    -- How many career skills the model was asked to match against, and whose career.
    catalog_size   INT,
    career_name    TEXT,
    -- [{"path":"README.md","chars":12,"found":true}, ...] — every file attempted,
    -- including the ones that came back empty. An absent file is evidence too.
    sources        JSONB,
    -- The model's answer as returned, before the evidence layer touched it.
    summary        TEXT,
    tech_stack     JSONB,
    matched_skills JSONB,
    -- Who wrote it, not just what it is. Nothing used to ask: the closest thing to a
    -- check passed on a one-line README edit in a fork.
    --
    -- Three verdicts, not two. Only NOT_CONTRIBUTED withholds evidence, and it is
    -- written only when GitHub answered with a real contributor list that does not
    -- credit this student. A rate limit or an outage records UNKNOWN, because
    -- collapsing the two would let a failed request accuse a student of padding.
    authorship_verdict VARCHAR(20),
    author_login       TEXT,
    author_commits     INT,
    total_commits      INT,
    -- A verdict without a reason is an accusation without a charge.
    authorship_reason  TEXT,
    -- GitHub's own byte count per language: the check on a config file that declares
    -- a framework the repository barely uses.
    language_bytes     JSONB,
    -- What this student DID, as opposed to what the repository IS.
    commit_subjects    JSONB,
    evidence_blocked   BOOLEAN DEFAULT FALSE,
    CONSTRAINT ck_gia_authorship_verdict
        CHECK (authorship_verdict IS NULL
               OR authorship_verdict IN ('CONTRIBUTED', 'NOT_CONTRIBUTED', 'UNKNOWN')),
    CONSTRAINT uq_gia_user_repo UNIQUE (user_id, repo_url),
    CONSTRAINT ck_gia_fetch_mode
        CHECK (fetch_mode IN ('AUTHENTICATED', 'ANONYMOUS')),
    CONSTRAINT fk_gia_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gia_user ON github_import_audit (user_id);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL,
    receiver_id UUID NOT NULL,
    sender_name VARCHAR(255),
    content     TEXT,
    type        VARCHAR(30) DEFAULT 'GENERAL',
    -- status doubles as the recipient's notification state:
    --   NEW = unread, READ = read, DELETED = dismissed/soft-deleted
    status      VARCHAR(30) DEFAULT 'NEW',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_feedback_type
        CHECK (type IS NULL OR type IN ('GENERAL', 'SKILL', 'CAREER', 'PORTFOLIO')),
    CONSTRAINT ck_feedback_status
        CHECK (status IS NULL OR status IN ('NEW', 'READ', 'DELETED')),
    CONSTRAINT fk_fb_sender
        FOREIGN KEY (sender_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_fb_receiver
        FOREIGN KEY (receiver_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback_attachment (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id   UUID         NOT NULL REFERENCES feedback(feedback_id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_type     VARCHAR(100),
    file_size     BIGINT,
    data          BYTEA        NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_review_requests (
    request_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL,
    mentor_id   UUID NOT NULL,
    status      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    create_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    CONSTRAINT ck_prr_status
        CHECK (status IN ('PENDING', 'REVIEWED', 'REJECTED')),
    CONSTRAINT fk_prr_student
        FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_prr_mentor
        FOREIGN KEY (mentor_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ============================================================
-- AI evidence / roadmap recommendations
-- ============================================================

CREATE TABLE IF NOT EXISTS student_skill_evidence (
    evidence_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Owner of the evidence. Evidence arrives before the student accepts the
    -- skill, so student_skill_id stays NULL until an accepted recommendation
    -- creates the student_skills row and back-fills the link.
    user_id          UUID NOT NULL,
    student_skill_id UUID,
    node_id          UUID,
    skill_name       VARCHAR(255),
    source_type      VARCHAR(30) NOT NULL,
    source_id        UUID,
    source_url       TEXT,
    evidence_text    TEXT,
    confidence       NUMERIC(5,2),
    detected_by      VARCHAR(50) DEFAULT 'ai-service',
    detected_at      TIMESTAMP,
    status           VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT ck_sse_source_type
        CHECK (source_type IN ('GITHUB_PROJECT', 'TRANSCRIPT', 'CHAT_FILE', 'MANUAL')),
    CONSTRAINT ck_sse_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT fk_sse_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sse_student_skill
        FOREIGN KEY (student_skill_id) REFERENCES student_skills (student_skill_id) ON DELETE CASCADE,
    CONSTRAINT fk_sse_node
        FOREIGN KEY (node_id) REFERENCES skill_nodes (node_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roadmap_recommendations (
    recommendation_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID,
    current_career_id   UUID NOT NULL,
    recommend_career_id UUID NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL DEFAULT 'SKIP_KNOWN_SKILLS',
    title               TEXT,
    summary             TEXT,
    reason              TEXT,
    confidence          NUMERIC(5,2),
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    decided_at          TIMESTAMP,
    CONSTRAINT ck_rr_type
        CHECK (recommendation_type IN ('SKIP_KNOWN_SKILLS', 'FAST_TRACK', 'CHANGE_PATH', 'ADD_ADVANCED_TOPICS')),
    CONSTRAINT ck_rr_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT fk_rr_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_rr_current_career
        FOREIGN KEY (current_career_id) REFERENCES career_roles (career_id) ON DELETE CASCADE,
    CONSTRAINT fk_rr_recommend_career
        FOREIGN KEY (recommend_career_id) REFERENCES career_roles (career_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roadmap_recommendation_items (
    rec_item_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL,
    node_id           UUID NOT NULL,
    action            VARCHAR(30) NOT NULL DEFAULT 'MARK_COMPLETE',
    reason            TEXT,
    evidence_ids      UUID[],
    confidence        NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT ck_rri_action
        CHECK (action IN ('MARK_COMPLETE', 'SKIP', 'UNLOCK', 'PRIORITIZE', 'ADD', 'REMOVE')),
    CONSTRAINT fk_rri_recommendation
        FOREIGN KEY (recommendation_id) REFERENCES roadmap_recommendations (recommendation_id) ON DELETE CASCADE,
    CONSTRAINT fk_rri_node
        FOREIGN KEY (node_id) REFERENCES skill_nodes (node_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rag_documents (
    document_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id    UUID,
    scope            VARCHAR(20) NOT NULL,
    source_type      VARCHAR(30) NOT NULL,
    file_name        TEXT NOT NULL,
    storage_url      TEXT,
    checksum         VARCHAR(64) NOT NULL,
    ingestion_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    ingestion_version INT NOT NULL DEFAULT 1,
    error_message    TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_rag_documents_scope
        CHECK (scope IN ('GLOBAL', 'STUDENT')),
    CONSTRAINT ck_rag_documents_source_type
        CHECK (source_type IN ('ADMIN_KNOWLEDGE', 'TRANSCRIPT')),
    CONSTRAINT ck_rag_documents_status
        CHECK (ingestion_status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT fk_rag_documents_owner
        FOREIGN KEY (owner_user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ============================================================
-- Recruitment processed cache
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
    company_id  VARCHAR(255) PRIMARY KEY,
    signatures  JSONB,
    infos       JSONB
);

CREATE TABLE IF NOT EXISTS recruitments (
    recruitment_id       VARCHAR(255) PRIMARY KEY,
    recruitment_infos    JSONB,
    descriptions         JSONB,
    posted_date          DATE,
    application_deadline DATE,
    -- Which career this posting is for, derived from its title by keyword.
    -- NULL when the title names no specialisation ("Software Engineer", "IT Staff").
    -- Filing a posting under the wrong career would make it evidence that the career
    -- requires whatever the posting happened to mention, which is worse than counting
    -- it for none: ~45% of current postings stay NULL on purpose.
    career_id            UUID REFERENCES career_roles (career_id) ON DELETE SET NULL
);

-- Which skills each posting asked for.
--
-- SkillExtractionServiceImpl has always known this — extractSkills() returns one
-- list per description — and always discarded it, aggregating straight into
-- skill_trends as a market-wide daily count. That is why "what do Backend
-- postings want" cost another full pass through the AI service, and why
-- career_required_skills was written by hand badly enough to claim Git for five
-- careers but not Backend.
CREATE TABLE IF NOT EXISTS recruitment_skills (
    link_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruitment_id VARCHAR(255) NOT NULL,
    skill_id       UUID NOT NULL,
    extracted_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    -- One posting asks for a skill once, however often the words appear.
    CONSTRAINT uq_rs_recruitment_skill UNIQUE (recruitment_id, skill_id),
    CONSTRAINT fk_rs_recruitment
        FOREIGN KEY (recruitment_id) REFERENCES recruitments (recruitment_id) ON DELETE CASCADE,
    CONSTRAINT fk_rs_skill
        FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rs_skill ON recruitment_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_rs_recruitment ON recruitment_skills (recruitment_id);

CREATE TABLE IF NOT EXISTS recruitment_posts (
    post_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     VARCHAR(255) NOT NULL,
    recruitment_id VARCHAR(255) NOT NULL,
    expired_at     DATE,
    CONSTRAINT fk_rp_company
        FOREIGN KEY (company_id) REFERENCES companies (company_id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_recruitment
        FOREIGN KEY (recruitment_id) REFERENCES recruitments (recruitment_id) ON DELETE CASCADE
);

-- ============================================================
-- Auth / chat
-- ============================================================

CREATE TABLE IF NOT EXISTS oauth_accounts (
    oauth_acc_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL,
    provider_id      VARCHAR(255) NOT NULL,
    provider_name    VARCHAR(255) NOT NULL,
    -- Provider OAuth access token, AES-GCM encrypted at rest (never plaintext). Used by the
    -- portfolio "Sync GitHub" flow to list a student's private repos. See TokenCipher.
    access_token_enc TEXT,
    token_scopes     VARCHAR(255),
    CONSTRAINT uq_oauth_provider UNIQUE (provider_name, provider_id),
    CONSTRAINT fk_oa_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Backfill columns on databases created before the Sync-GitHub feature.
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS access_token_enc TEXT;
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS token_scopes     VARCHAR(255);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expired_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_rt_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Password reset (magic link). Only the SHA-256 digest of the token is stored, the
-- raw token travels once in the emailed link. used_at makes a token single-use;
-- expires_at bounds the window (~30 min) so a leaked or scanner-prefetched link
-- stops working quickly.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_prt_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,
    session_name VARCHAR(255),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cs_user
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    role       VARCHAR(255) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cm_session
        FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id) ON DELETE CASCADE
);

-- ============================================================
-- Helpful indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_career_id                ON students (career_id);
CREATE INDEX IF NOT EXISTS idx_students_portfolio_slug           ON students (portfolio_slug);
CREATE INDEX IF NOT EXISTS idx_crs_career_id                     ON career_required_skills (career_id);
CREATE INDEX IF NOT EXISTS idx_crs_skill_id                      ON career_required_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_career_id             ON skill_nodes (career_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_skill_id              ON skill_nodes (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_type_id               ON skill_nodes (type_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_previous_node         ON skill_nodes (previous_node);
CREATE INDEX IF NOT EXISTS idx_roadmap_node_layouts_node_id      ON roadmap_node_layouts (node_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_parent_node           ON skill_nodes (parent_node);
CREATE INDEX IF NOT EXISTS idx_student_skills_user_id            ON student_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id           ON student_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id          ON student_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_node_id          ON student_progress (node_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_project_user_id         ON portfolio_project (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_configs_user_id         ON portfolio_configs (user_id);
CREATE INDEX IF NOT EXISTS idx_student_education_user_id         ON student_education (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sender_id                ON feedback (sender_id);
CREATE INDEX IF NOT EXISTS idx_feedback_receiver_id              ON feedback (receiver_id);
CREATE INDEX IF NOT EXISTS idx_feedback_attachment_feedback_id   ON feedback_attachment(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_receiver_status          ON feedback (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_prr_student_id                    ON portfolio_review_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_skill_trends_skill_id             ON skill_trends (skill_id);
-- Every roadmap request asks for the trends inside the demand window. Without
-- this the service read the whole table and filtered in Java, once per request.
CREATE INDEX IF NOT EXISTS idx_skill_trends_week_stamp           ON skill_trends (week_stamp);
CREATE INDEX IF NOT EXISTS idx_sse_user_id                       ON student_skill_evidence (user_id);
CREATE INDEX IF NOT EXISTS idx_sse_student_skill_id              ON student_skill_evidence (student_skill_id);
CREATE INDEX IF NOT EXISTS idx_sse_node_id                       ON student_skill_evidence (node_id);
CREATE INDEX IF NOT EXISTS idx_rr_user_id                        ON roadmap_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_rr_current_career_id              ON roadmap_recommendations (current_career_id);
CREATE INDEX IF NOT EXISTS idx_rr_recommend_career_id            ON roadmap_recommendations (recommend_career_id);
CREATE INDEX IF NOT EXISTS idx_rri_recommendation_id             ON roadmap_recommendation_items (recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rri_node_id                       ON roadmap_recommendation_items (node_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_owner_source        ON rag_documents (owner_user_id, source_type);
CREATE INDEX IF NOT EXISTS idx_recruitment_posts_company_id      ON recruitment_posts (company_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_posts_recruitment_id  ON recruitment_posts (recruitment_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id            ON oauth_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id            ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id      ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id             ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id          ON chat_messages (session_id);

-- ============================================================
-- FLM (FPT curriculum) overlay: subjects, their skill coverage & lesson
-- resources, and each student's declared FPT subjects. Powers the per-student
-- dynamic roadmap (passed subject -> covered skill -> transcript evidence) and
-- the "learn at FPT" resources shown on each roadmap node.
-- ============================================================
-- The subject catalog is cohort-independent: one row per subject code, holding the
-- shared syllabus facts (name, credits, prerequisite, CLOs/skills, resources). The
-- per-cohort term placement lives in fpt_curriculum_subjects, NOT here, so the same
-- subject shared by many curricula is stored once (no redundant duplication).
CREATE TABLE IF NOT EXISTS fpt_subjects (
    code          VARCHAR(20) PRIMARY KEY,
    name          TEXT NOT NULL,
    credits       INT,
    prerequisite  TEXT,
    description   TEXT
);

-- One row per FLM curriculum version (per cohort/program), e.g. BIT_SE_K21B. Multiple
-- versions coexist; a sync of one never overwrites another.
CREATE TABLE IF NOT EXISTS fpt_curricula (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(60) NOT NULL UNIQUE,   -- BIT_SE_K21B
    curid          VARCHAR(20),                   -- FLM numeric id used to scrape it
    program        VARCHAR(20),                   -- SE, IA, AI, ...
    cohort         INT,                           -- K number, e.g. 21
    batch          VARCHAR(20),                   -- B / C / D_K20A ...
    effective_date DATE,
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    synced_at      TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fc_program_cohort ON fpt_curricula (program, cohort);

-- Maps a subject into a curriculum at a given term. Same subject_code, different
-- semester across curricula — this is where "trùng môn khác kỳ" is resolved.
--
-- combo_code splits a curriculum into its specialisation tracks. FLM's curriculum only
-- reserves slots (SE_COM*1..*3) and the real subjects live behind a combo: Intensive
-- Java gives HSF302/SBA301/MSS301, React/NodeJS and .NET give different ones. NULL means
-- a trunk subject every student on the curriculum takes; a value means it belongs to
-- that combo alone. Without this the tracks collapse and a .NET student is shown Java.
-- combo_name is denormalised for display only — one importer writes both, so it cannot
-- drift, and it saves a table for what is a handful of rows per curriculum.
CREATE TABLE IF NOT EXISTS fpt_curriculum_subjects (
    curriculum_id UUID NOT NULL,
    subject_code  VARCHAR(20) NOT NULL,
    semester      INT,
    combo_code    VARCHAR(40),
    combo_name    TEXT,
    PRIMARY KEY (curriculum_id, subject_code),
    CONSTRAINT fk_fcs_curriculum FOREIGN KEY (curriculum_id) REFERENCES fpt_curricula (id) ON DELETE CASCADE,
    CONSTRAINT fk_fcs_subject FOREIGN KEY (subject_code) REFERENCES fpt_subjects (code) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fcs_curriculum ON fpt_curriculum_subjects (curriculum_id);
-- The student read path is "trunk OR my combo", so it always filters on both columns.
CREATE INDEX IF NOT EXISTS idx_fcs_curriculum_combo ON fpt_curriculum_subjects (curriculum_id, combo_code);

CREATE TABLE IF NOT EXISTS fpt_subject_skills (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code  VARCHAR(20) NOT NULL,
    skill_id      UUID,
    skill_name    VARCHAR(255) NOT NULL,
    CONSTRAINT fk_fss_subject FOREIGN KEY (subject_code) REFERENCES fpt_subjects (code) ON DELETE CASCADE,
    CONSTRAINT fk_fss_skill FOREIGN KEY (skill_id) REFERENCES skills (skill_id) ON DELETE SET NULL,
    CONSTRAINT uq_fss UNIQUE (subject_code, skill_name)
);
CREATE INDEX IF NOT EXISTS idx_fss_skill_name ON fpt_subject_skills (LOWER(skill_name));

-- Course Learning Outcomes, straight from the syllabus (gvLO). These are what a subject
-- page shows a student ("be able to work with JDBC"); they are also the text the skill
-- matcher reads, but that happens upstream in the scraper. Subjects carry 4-13 each.
CREATE TABLE IF NOT EXISTS fpt_subject_clos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code  VARCHAR(20) NOT NULL,
    code          VARCHAR(20) NOT NULL,   -- CLO1, CLO2, ...
    outcome       TEXT NOT NULL,
    order_index   INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_fsc_subject FOREIGN KEY (subject_code) REFERENCES fpt_subjects (code) ON DELETE CASCADE,
    CONSTRAINT uq_fsc UNIQUE (subject_code, code)
);
CREATE INDEX IF NOT EXISTS idx_fsc_subject ON fpt_subject_clos (subject_code);

-- kind=MATERIAL is a bibliographic reference (textbook, ISBN, an online article's link);
-- kind=SESSION is one class session, and the only rows that ever carry a real file.
--
-- source_url is where a file was harvested from and is NEVER sent to a client: we mirror
-- the file into our own storage and serve that. storage_path is the object key in the
-- private bucket; a signed URL is minted per request after the FPT check, so the gate is
-- a real boundary rather than a hidden link. NULL storage_path = not mirrored (yet), which
-- is normal — 7 of 28 subjects publish no files at all.
CREATE TABLE IF NOT EXISTS fpt_subject_resources (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code  VARCHAR(20) NOT NULL,
    kind          VARCHAR(20) NOT NULL,
    title         TEXT NOT NULL,
    url           TEXT,
    source_url    TEXT,
    storage_path  TEXT,
    size_bytes    BIGINT,
    mirrored_at   TIMESTAMP,
    topic         TEXT,
    clo_ref       TEXT,
    order_index   INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_fsr_subject FOREIGN KEY (subject_code) REFERENCES fpt_subjects (code) ON DELETE CASCADE,
    CONSTRAINT ck_fsr_kind CHECK (kind IN ('MATERIAL', 'SESSION'))
);
CREATE INDEX IF NOT EXISTS idx_fsr_subject ON fpt_subject_resources (subject_code);

CREATE TABLE IF NOT EXISTS student_fpt_subjects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    subject_code  VARCHAR(20) NOT NULL,
    curriculum_id UUID,
    status        VARCHAR(20) NOT NULL DEFAULT 'PASSED',
    source        VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sfs_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sfs_subject FOREIGN KEY (subject_code) REFERENCES fpt_subjects (code) ON DELETE CASCADE,
    CONSTRAINT fk_sfs_curriculum FOREIGN KEY (curriculum_id) REFERENCES fpt_curricula (id) ON DELETE SET NULL,
    CONSTRAINT ck_sfs_status CHECK (status IN ('PASSED', 'IN_PROGRESS', 'PLANNED')),
    CONSTRAINT ck_sfs_source CHECK (source IN ('CURRICULUM_TERM', 'MANUAL')),
    CONSTRAINT uq_sfs UNIQUE (user_id, subject_code)
);
CREATE INDEX IF NOT EXISTS idx_sfs_user ON student_fpt_subjects (user_id);

-- ============================================================
-- In-place migrations for databases created before this revision
-- ============================================================
-- CREATE TABLE IF NOT EXISTS above never adds columns to a pre-existing table,
-- so bring skill_nodes up to date with the new roadmap-selection columns.
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS selection     VARCHAR(20) DEFAULT 'ALL';
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS choose_count  INT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS node_kind     VARCHAR(20) DEFAULT 'CORE';
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS axis          VARCHAR(20) DEFAULT 'MAIN';
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS is_optional   BOOLEAN DEFAULT FALSE;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS is_checkpoint BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_skill_nodes_selection') THEN
        ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_selection
            CHECK (selection IS NULL OR selection IN ('ALL', 'CHOOSE_ONE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_skill_nodes_node_kind') THEN
        ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_node_kind
            CHECK (node_kind IS NULL OR node_kind IN ('CORE', 'ALTERNATIVE', 'OPTIONAL'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_skill_nodes_axis') THEN
        ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_axis
            CHECK (axis IS NULL OR axis IN ('MAIN', 'BRANCH'));
    END IF;
END $$;

-- Multi-curriculum: subject term placement moves out of fpt_subjects into
-- fpt_curriculum_subjects so per-cohort curricula can coexist without overwriting.
ALTER TABLE fpt_subjects        DROP COLUMN IF EXISTS semester;
ALTER TABLE student_fpt_subjects ADD COLUMN IF NOT EXISTS curriculum_id UUID;
ALTER TABLE students             ADD COLUMN IF NOT EXISTS fpt_curriculum_id UUID;

-- Specialisation combos: which track's subjects a curriculum row belongs to, and which
-- track the student picked. NULL combo_code = trunk (everyone); NULL fpt_combo_code =
-- the student hasn't picked, so they see the trunk only rather than another combo's.
ALTER TABLE fpt_curriculum_subjects ADD COLUMN IF NOT EXISTS combo_code VARCHAR(40);
ALTER TABLE fpt_curriculum_subjects ADD COLUMN IF NOT EXISTS combo_name TEXT;
ALTER TABLE students                ADD COLUMN IF NOT EXISTS fpt_combo_code VARCHAR(40);
CREATE INDEX IF NOT EXISTS idx_fcs_curriculum_combo ON fpt_curriculum_subjects (curriculum_id, combo_code);

-- GitHub "Sync" credentials live on the student (per-user), never on the login-identity
-- oauth_account, so a GitHub account with several emails/roles can't cross-link tokens.
ALTER TABLE students ADD COLUMN IF NOT EXISTS github_sync_token_enc TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS github_sync_scopes    VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS github_login          VARCHAR(255);

-- Admission moves from a bare year to a full date: the counselor enters it from the
-- admission record, so the day and month are real data rather than something the form
-- had to invent. Existing years become 1 January of that year; the counselor can enter
-- the exact date later.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'students' AND column_name = 'year_of_admission') THEN
        ALTER TABLE students
            ALTER COLUMN year_of_admission TYPE DATE
            USING make_date(year_of_admission, 1, 1);
        ALTER TABLE students RENAME COLUMN year_of_admission TO admission_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'academic_counselor' AND column_name = 'year_of_admission') THEN
        ALTER TABLE academic_counselor
            ALTER COLUMN year_of_admission TYPE DATE
            USING make_date(year_of_admission, 1, 1);
        ALTER TABLE academic_counselor RENAME COLUMN year_of_admission TO admission_date;
    END IF;
END $$;

-- Mirrored materials: we host the file, so the FPT gate actually withholds it.
ALTER TABLE fpt_subject_resources ADD COLUMN IF NOT EXISTS source_url   TEXT;
ALTER TABLE fpt_subject_resources ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE fpt_subject_resources ADD COLUMN IF NOT EXISTS size_bytes   BIGINT;
ALTER TABLE fpt_subject_resources ADD COLUMN IF NOT EXISTS mirrored_at  TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sfs_curriculum') THEN
        ALTER TABLE student_fpt_subjects ADD CONSTRAINT fk_sfs_curriculum
            FOREIGN KEY (curriculum_id) REFERENCES fpt_curricula (id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_st_fpt_curriculum') THEN
        ALTER TABLE students ADD CONSTRAINT fk_st_fpt_curriculum
            FOREIGN KEY (fpt_curriculum_id) REFERENCES fpt_curricula (id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- Career-matched self-assessment (optional onboarding step) and the student
-- level it produces.
--
-- The level is read by three consumers: the roadmap (which nodes are already
-- covered), Market Pulse (which postings to show first) and the AI mentor
-- (how to pitch an answer). Taking the assessment is optional, so every one of
-- them has to work when there is no row here at all.
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_assessments (
    assessment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL,
    career_id          UUID NOT NULL,
    -- Frozen copy of the questions this run served, so a later catalog change
    -- cannot make a stored answer set unreadable.
    questions          JSONB NOT NULL,
    -- [{"skillId":"...","skillName":"React","level":"APPLIED","note":"..."}]
    answers            JSONB NOT NULL,
    ai_level           VARCHAR(20),          -- after the JUNIOR ceiling
    ai_raw_level       VARCHAR(20),          -- what the model said before it
    ai_rationale       TEXT,
    ai_confidence      NUMERIC(5,2),
    ratio_all          NUMERIC(5,2),
    ratio_verified     NUMERIC(5,2),
    required_count     INT,
    model_used         VARCHAR(80),
    -- What the run actually changed on the roadmap, and the audit row proving it.
    applied_node_count INT NOT NULL DEFAULT 0,
    recommendation_id  UUID,
    status             VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    computed_at        TIMESTAMP,
    created_at         TIMESTAMP NOT NULL DEFAULT now(),
    -- All six rungs of SeniorityLevel.LADDER, not four. SeniorityCalculator.bandOf()
    -- returns BEGINNER below 0.10 coverage and EXPERT at 0.95, and BEGINNER is the
    -- ordinary outcome rather than an edge case: the assessment grades at most
    -- MAX_QUESTIONS = 15 skills, while Backend's core set is 181, so 15/181 = 8.3%
    -- lands under FRESHER_AT every time. Listing only four values made that a
    -- constraint violation on the second save in submitAssessment -- i.e. a 500
    -- after the model call had already been paid for.
    CONSTRAINT ck_sa_level  CHECK (ai_level IS NULL
                                   OR ai_level IN ('BEGINNER','FRESHER','JUNIOR',
                                                   'MID','SENIOR','EXPERT')),
    CONSTRAINT ck_sa_status CHECK (status IN ('COMPLETED','FAILED')),
    CONSTRAINT fk_sa_user   FOREIGN KEY (user_id)   REFERENCES users (user_id)          ON DELETE CASCADE,
    CONSTRAINT fk_sa_career FOREIGN KEY (career_id) REFERENCES career_roles (career_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sa_user ON student_assessments (user_id);

-- A declared skill gains a level. Without this the assessment's whole output
-- has nowhere to live that the roadmap personalizer can read.
ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS proficiency   SMALLINT;
ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS self_declared BOOLEAN NOT NULL DEFAULT true;
-- TRANSCRIPT | GITHUB | MENTOR, or NULL for self-declared. Objective sources
-- outrank self-declaration, so this is what stops an assessment overwriting a
-- level that was actually verified.
ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS verified_by   VARCHAR(30);
ALTER TABLE student_skills ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP NOT NULL DEFAULT now();

-- Seniority on postings, so Market Pulse can answer "jobs at my level".
-- Parsed from recruitment_infos->>'experience' plus the title; UNKNOWN is a
-- real, common outcome and is never hidden from results.
ALTER TABLE recruitments ADD COLUMN IF NOT EXISTS seniority     VARCHAR(20);
ALTER TABLE recruitments ADD COLUMN IF NOT EXISTS classified_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_recruit_seniority ON recruitments (seniority, posted_date);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_ss_proficiency') THEN
        ALTER TABLE student_skills ADD CONSTRAINT ck_ss_proficiency
            CHECK (proficiency IS NULL OR proficiency BETWEEN 1 AND 4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_ss_verified_by') THEN
        ALTER TABLE student_skills ADD CONSTRAINT ck_ss_verified_by
            CHECK (verified_by IS NULL
                   OR verified_by IN ('TRANSCRIPT','GITHUB','MENTOR'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_recruit_seniority') THEN
        ALTER TABLE recruitments ADD CONSTRAINT ck_recruit_seniority
            CHECK (seniority IS NULL
                   OR seniority IN ('FRESHER','JUNIOR','MID','SENIOR','UNKNOWN'));
    END IF;

    -- Repair, not creation: student_assessments is created by CREATE TABLE IF NOT
    -- EXISTS above, so a database that already has the table keeps whatever
    -- ck_sa_level it was born with -- including the four-value version that makes
    -- every BEGINNER verdict a 500. Drop and re-add unconditionally so re-running
    -- this script fixes an existing database instead of silently skipping it.
    -- Same reason: an existing student_node_selections keeps the three-column
    -- shape it was born with, and the entity now maps two more. With
    -- ddl-auto: none a field the table lacks takes down every endpoint that
    -- touches it, so these have to land with the code, not after it.
    ALTER TABLE student_node_selections
        ADD COLUMN IF NOT EXISTS auto_selected BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE student_node_selections
        ADD COLUMN IF NOT EXISTS auto_reason TEXT;

    ALTER TABLE student_assessments DROP CONSTRAINT IF EXISTS ck_sa_level;
    ALTER TABLE student_assessments ADD CONSTRAINT ck_sa_level
        CHECK (ai_level IS NULL
               OR ai_level IN ('BEGINNER','FRESHER','JUNIOR','MID','SENIOR','EXPERT'));

    -- Same story for the pre-ceiling value, which was never constrained at all
    -- but should agree with the ladder it is compared against.
    ALTER TABLE student_assessments DROP CONSTRAINT IF EXISTS ck_sa_raw_level;
    ALTER TABLE student_assessments ADD CONSTRAINT ck_sa_raw_level
        CHECK (ai_raw_level IS NULL
               OR ai_raw_level IN ('BEGINNER','FRESHER','JUNIOR','MID','SENIOR','EXPERT'));
END $$;

-- Supersede-by-source lookups when a re-taken assessment replaces an older,
-- weaker claim about the same skill.
CREATE INDEX IF NOT EXISTS idx_sse_user_detected ON student_skill_evidence (user_id, detected_by);

-- ============================================================================
-- Job identity, as distinct from posting identity.
--
-- recruitment_id comes from the source's URL slug, so a company that takes a
-- listing down and re-posts it produces two rows for one job and inflates every
-- demand figure computed from them. dedup_key is company + title + location,
-- slugified by the scraper.
--
-- The company MUST stay in the key. Generic titles genuinely repeat across
-- employers - "Test Automation Engineer" was live at two different companies on
-- the same day in this dataset - so keying on the title alone would merge two
-- unrelated jobs and under-report demand instead of over-reporting it.
-- ============================================================================
ALTER TABLE recruitments ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(300);
CREATE INDEX IF NOT EXISTS idx_recruit_dedup ON recruitments (dedup_key, posted_date DESC);

-- Backfill for rows scraped before the key existed. The company slug is already
-- embedded in company_id ("itviec.co-<slug>"), so this reproduces the scraper's
-- own key rather than inventing a second convention.
UPDATE recruitments r
SET dedup_key =
        trim(BOTH '-' FROM replace(rp.company_id, 'itviec.co-', ''))
        || '|' || trim(BOTH '-' FROM lower(regexp_replace(
                coalesce(r.recruitment_infos->>'title', ''), '[^a-zA-Z0-9]+', '-', 'g')))
        || '|' || trim(BOTH '-' FROM lower(regexp_replace(
                coalesce(r.recruitment_infos->>'location', ''), '[^a-zA-Z0-9]+', '-', 'g')))
FROM recruitment_posts rp
WHERE rp.recruitment_id = r.recruitment_id
  AND r.dedup_key IS NULL;

-- ============================================================================
-- Publication gate for roadmap nodes (FR2.3: at least two resource links).
--
-- The rule applies to LEAF nodes only. A node that owns children is a section
-- header — "Java Basics" grouping eight sub-skills — and the learning material
-- lives in its children, not on the header itself. Demanding two links there is
-- a misreading of the requirement, and enforcing it would have hidden 81 headers
-- and gutted two roadmaps for no benefit to any student.
-- ============================================================================
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_skill_nodes_status') THEN
        ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_status
            CHECK (status IN ('DRAFT', 'PUBLISHED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_nodes_status ON skill_nodes (career_id, status);

-- Withhold leaf nodes that cannot teach anything: fewer than two links and no
-- children to carry the content instead.
--
-- Checkpoints are exempt for the same reason headers are. A checkpoint is a
-- deliverable the student builds ("Checkpoint - Simple CRUD Apps"), not reading
-- material, so demanding two links of it is the same category error the comment
-- above describes -- and the seeder already says so: PUBLISHABLE_STATUS admits
-- CHECKPOINT alongside READY and GROUP. Without this clause the rule hides 12 of
-- them, which is 12 places a roadmap stops telling the student to build anything.
UPDATE skill_nodes sn
SET status = 'DRAFT'
WHERE (sn.resource IS NULL
       OR jsonb_typeof(sn.resource) <> 'array'
       OR jsonb_array_length(sn.resource) < 2)
  AND NOT coalesce(sn.is_checkpoint, FALSE)
  AND NOT EXISTS (SELECT 1 FROM skill_nodes child WHERE child.parent_node = sn.node_id);

-- ============================================================================
-- skill_nodes: columns the entity maps that no init script ever created.
--
-- These eight were added by hand to the running database over several sessions
-- and never written back here, so a fresh `docker compose up` produced a schema
-- Hibernate could not read: with ddl-auto: none and no Flyway, one missing
-- column 500s every endpoint that touches a node. Repairing them here is the
-- only place a new install can pick them up.
--
-- difficulty is 1..4, not the 1..5 it was first given. The column is empty on
-- all 4.177 rows, so narrowing it migrates nothing; four is the band count three
-- independent sources use (MyEngineeringPath, Prosumely, FindSkill) and, more to
-- the point, it is the scale students are already measured on -- difficulty 3
-- means "wants APPLIED". A fifth band would map to nothing.
--
-- estimated_hours is DEPRECATED and stays empty. No serious source estimates
-- study hours per node: whole paths get estimated (18-24 / 9-12 / 3-6 months),
-- single nodes do not. A per-node hour figure is a number the student can
-- measure and find wrong. The column is created only because the entity still
-- maps it; nothing writes it and nothing should read it.
-- ============================================================================
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS depth           SMALLINT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS sort_order      INT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS subtree_size    INT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS root_node_id    UUID;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS difficulty      SMALLINT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS estimated_hours SMALLINT;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS objectives      JSONB;
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS why_it_matters  TEXT;

CREATE INDEX IF NOT EXISTS idx_skill_nodes_depth ON skill_nodes (career_id, depth);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_sort  ON skill_nodes (parent_node, sort_order);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_root  ON skill_nodes (root_node_id);

DO $$
BEGIN
    -- Unconditional: databases created before this ran carry the 1..5 version,
    -- and IF NOT EXISTS would leave exactly those untouched -- which are the only
    -- ones that need it.
    ALTER TABLE skill_nodes DROP CONSTRAINT IF EXISTS ck_skill_nodes_difficulty;
    ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_difficulty
        CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 4));

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_skill_nodes_estimated_hours') THEN
        ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_estimated_hours
            CHECK (estimated_hours IS NULL OR (estimated_hours >= 1 AND estimated_hours <= 200));
    END IF;
END $$;

-- ============================================================================
-- required_proficiency is a confidence bar in PERCENT, 0-100.
--
-- Two units shared this column: 3.706 rows held 1..4 (a ProficiencyLevel) while
-- 246 held 65 (a percentage). meetsNodeProficiency divides by 100, so a 2 became
-- a 0.02 bar -- one nothing can fail, which meant those nodes had no bar of
-- their own and rested entirely on the importance floor. Converted to the
-- percentages the confidence table already uses: AWARE 40, PRACTICED 55,
-- APPLIED 70, PROFESSIONAL 85.
--
-- The constraint rejects 1..9. That range cannot be a real confidence bar -- the
-- lowest importance floor is 60 -- so a value there can only be the old unit
-- coming back, and it should fail loudly at the seeder rather than quietly at
-- the student.
-- ============================================================================
UPDATE skill_nodes SET required_proficiency =
    CASE required_proficiency WHEN 1 THEN 40 WHEN 2 THEN 55 WHEN 3 THEN 70 WHEN 4 THEN 85 END
WHERE required_proficiency BETWEEN 1 AND 4;

DO $$
BEGIN
    ALTER TABLE skill_nodes DROP CONSTRAINT IF EXISTS ck_skill_nodes_required_proficiency;
    ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_required_proficiency
        CHECK (required_proficiency IS NULL
               OR required_proficiency = 0
               OR (required_proficiency >= 10 AND required_proficiency <= 100));
END $$;

-- ── skill_nodes.tier — which student level a node is for ─────────────────────
-- Added unconditionally: CREATE TABLE IF NOT EXISTS skips an existing database
-- entirely, so a column introduced after the first install only ever reaches a
-- running DB through a repair block like this one. Skipping it is how eight
-- columns the entity mapped came to not exist at all.
--
-- Derived from `depth`, not `difficulty`: difficulty is NULL on every row, so
-- the obvious formula would have filed 100% of the catalog as one tier.
-- Depth 0-1 / 2 / 3+ splits it 26 / 39 / 35.
ALTER TABLE skill_nodes ADD COLUMN IF NOT EXISTS tier SMALLINT;

DO $$
BEGIN
    ALTER TABLE skill_nodes DROP CONSTRAINT IF EXISTS ck_skill_nodes_tier;
    ALTER TABLE skill_nodes ADD CONSTRAINT ck_skill_nodes_tier
        CHECK (tier IS NULL OR tier BETWEEN 1 AND 3);
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_nodes_tier ON skill_nodes (tier);

-- Depth is measured from the roadmap the node is IN, not from the career root.
-- Absolute depth put React's own `JSX` and `Props vs State` at Advanced, which
-- are the first two things anyone learns about React. The baseline is the
-- outermost ancestor big enough to be entered as its own roadmap
-- (SubRoadmapClassifier.MIN_SUBTREE = 12), excluding CHOOSE_ONE groups, which
-- sum to the size of their options while teaching none of it.
WITH RECURSIVE anc AS (
    SELECT sn.node_id, sn.parent_node AS anc_id
    FROM skill_nodes sn WHERE sn.parent_node IS NOT NULL
    UNION ALL
    SELECT a.node_id, p.parent_node
    FROM anc a JOIN skill_nodes p ON p.node_id = a.anc_id
    WHERE p.parent_node IS NOT NULL
), base AS (
    SELECT a.node_id, min(anc_node.depth) AS base_depth
    FROM anc a JOIN skill_nodes anc_node ON anc_node.node_id = a.anc_id
    WHERE coalesce(anc_node.subtree_size, 0) >= 12
      AND upper(coalesce(anc_node.selection, 'ALL')) <> 'CHOOSE_ONE'
    GROUP BY a.node_id
), relative AS (
    SELECT sn.node_id,
           CASE WHEN sn.depth IS NULL THEN NULL
                ELSE sn.depth - coalesce(b.base_depth, 0) END AS rel_depth
    FROM skill_nodes sn LEFT JOIN base b ON b.node_id = sn.node_id
)
UPDATE skill_nodes sn SET tier = CASE
        WHEN r.rel_depth IS NULL THEN NULL
        WHEN r.rel_depth <= 1 THEN 1
        WHEN r.rel_depth = 2 THEN 2
        ELSE 3
    END
FROM relative r
WHERE r.node_id = sn.node_id AND sn.tier IS NULL;
