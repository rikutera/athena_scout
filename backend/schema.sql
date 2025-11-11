-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.activity_logs_id_seq;

CREATE SEQUENCE public.activity_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.activity_logs_id_seq TO postgres;

-- DROP SEQUENCE public.api_usage_logs_id_seq;

CREATE SEQUENCE public.api_usage_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.api_usage_logs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.api_usage_logs_id_seq TO postgres;

-- DROP SEQUENCE public.generation_history_id_seq;

CREATE SEQUENCE public.generation_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.generation_history_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.generation_history_id_seq TO postgres;

-- DROP SEQUENCE public.job_types_id_seq;

CREATE SEQUENCE public.job_types_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.job_types_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.job_types_id_seq TO postgres;

-- DROP SEQUENCE public.login_logs_id_seq;

CREATE SEQUENCE public.login_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.login_logs_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.login_logs_id_seq TO postgres;

-- DROP SEQUENCE public.output_rules_id_seq;

CREATE SEQUENCE public.output_rules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.output_rules_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.output_rules_id_seq TO postgres;

-- DROP SEQUENCE public.templates_id_seq;

CREATE SEQUENCE public.templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.templates_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.templates_id_seq TO postgres;

-- DROP SEQUENCE public.user_output_rules_id_seq;

CREATE SEQUENCE public.user_output_rules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_output_rules_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.user_output_rules_id_seq TO postgres;

-- DROP SEQUENCE public.user_templates_id_seq;

CREATE SEQUENCE public.user_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_templates_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.user_templates_id_seq TO postgres;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;
-- public.job_types definition

-- Drop table

-- DROP TABLE public.job_types;

CREATE TABLE public.job_types (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	definition text NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT job_types_name_key UNIQUE (name),
	CONSTRAINT job_types_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.job_types OWNER TO postgres;
GRANT ALL ON TABLE public.job_types TO postgres;


-- public.output_rules definition

-- Drop table

-- DROP TABLE public.output_rules;

CREATE TABLE public.output_rules (
	id serial4 NOT NULL,
	rule_name varchar(255) NOT NULL,
	rule_text text NOT NULL,
	description text NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT output_rules_pkey PRIMARY KEY (id),
	CONSTRAINT output_rules_rule_name_key UNIQUE (rule_name)
);

-- Permissions

ALTER TABLE public.output_rules OWNER TO postgres;
GRANT ALL ON TABLE public.output_rules TO postgres;


-- public.templates definition

-- Drop table

-- DROP TABLE public.templates;

CREATE TABLE public.templates (
	id serial4 NOT NULL,
	template_name varchar(255) NOT NULL,
	job_type varchar(255) NULL,
	industry varchar(255) NULL,
	company_requirement text NULL,
	offer_template text NULL,
	output_rule_id int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.templates OWNER TO postgres;
GRANT ALL ON TABLE public.templates TO postgres;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id serial4 NOT NULL,
	username varchar(255) NOT NULL,
	password_hash varchar(255) NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	user_status varchar(50) DEFAULT 'active'::character varying NULL,
	user_role varchar(50) DEFAULT 'user'::character varying NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_username_key UNIQUE (username)
);

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;


-- public.activity_logs definition

-- Drop table

-- DROP TABLE public.activity_logs;

CREATE TABLE public.activity_logs (
	id serial4 NOT NULL,
	user_id int4 NULL,
	username varchar(255) NULL,
	"action" varchar(100) NULL,
	details text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
	CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.activity_logs OWNER TO postgres;
GRANT ALL ON TABLE public.activity_logs TO postgres;


-- public.api_usage_logs definition

-- Drop table

-- DROP TABLE public.api_usage_logs;

CREATE TABLE public.api_usage_logs (
	id serial4 NOT NULL,
	input_tokens int4 NOT NULL,
	output_tokens int4 NOT NULL,
	total_tokens int4 NOT NULL,
	total_cost numeric(10, 6) NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	user_id int4 NULL,
	CONSTRAINT api_usage_logs_pkey PRIMARY KEY (id),
	CONSTRAINT api_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_api_usage_created_at ON public.api_usage_logs USING btree (created_at);
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs USING btree (user_id);

-- Permissions

ALTER TABLE public.api_usage_logs OWNER TO postgres;
GRANT ALL ON TABLE public.api_usage_logs TO postgres;


-- public.generation_history definition

-- Drop table

-- DROP TABLE public.generation_history;

CREATE TABLE public.generation_history (
	id serial4 NOT NULL,
	user_id int4 NULL,
	username varchar(255) NULL,
	job_type varchar(100) NULL,
	industry varchar(100) NULL,
	student_profile text NULL,
	generated_comment text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	template_name varchar(255) NULL,
	CONSTRAINT generation_history_pkey PRIMARY KEY (id),
	CONSTRAINT generation_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.generation_history OWNER TO postgres;
GRANT ALL ON TABLE public.generation_history TO postgres;


-- public.login_logs definition

-- Drop table

-- DROP TABLE public.login_logs;

CREATE TABLE public.login_logs (
	id serial4 NOT NULL,
	user_id int4 NULL,
	username varchar(255) NULL,
	login_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	ip_address varchar(45) NULL,
	user_agent text NULL,
	CONSTRAINT login_logs_pkey PRIMARY KEY (id),
	CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.login_logs OWNER TO postgres;
GRANT ALL ON TABLE public.login_logs TO postgres;


-- public.user_output_rules definition

-- Drop table

-- DROP TABLE public.user_output_rules;

CREATE TABLE public.user_output_rules (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	output_rule_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT user_output_rules_pkey PRIMARY KEY (id),
	CONSTRAINT user_output_rules_user_id_output_rule_id_key UNIQUE (user_id, output_rule_id),
	CONSTRAINT user_output_rules_output_rule_id_fkey FOREIGN KEY (output_rule_id) REFERENCES public.output_rules(id) ON DELETE CASCADE,
	CONSTRAINT user_output_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_user_output_rules_output_rule_id ON public.user_output_rules USING btree (output_rule_id);

-- Permissions

ALTER TABLE public.user_output_rules OWNER TO postgres;
GRANT ALL ON TABLE public.user_output_rules TO postgres;


-- public.user_templates definition

-- Drop table

-- DROP TABLE public.user_templates;

CREATE TABLE public.user_templates (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	template_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT user_templates_pkey PRIMARY KEY (id),
	CONSTRAINT user_templates_user_id_template_id_key UNIQUE (user_id, template_id),
	CONSTRAINT user_templates_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE,
	CONSTRAINT user_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.user_templates OWNER TO postgres;
GRANT ALL ON TABLE public.user_templates TO postgres;




-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;