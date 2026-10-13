USE job_board;

ALTER TABLE applications
    ADD COLUMN cv_file_name VARCHAR(255) NULL,
    ADD COLUMN cv_file MEDIUMBLOB NULL;
