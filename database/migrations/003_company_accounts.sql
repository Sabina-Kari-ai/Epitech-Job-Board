USE job_board;

ALTER TABLE users
    ADD COLUMN company_id INT UNSIGNED NULL,
    ADD KEY idx_users_company_id (company_id),
    DROP CHECK chk_users_role,
    ADD CONSTRAINT chk_users_role
        CHECK (role IN ('candidate', 'company', 'admin')),
    ADD CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
