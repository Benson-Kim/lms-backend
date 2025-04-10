-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_image VARCHAR(255),
  is_system_admin BOOLEAN DEFAULT FALSE,
  is_individual_learner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'school' or 'organization'
  domain VARCHAR(255) UNIQUE,
  logo_url VARCHAR(255),
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, name)
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(20) NOT NULL, -- 'client', 'department', 'group'
  entity_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'instructor', 'student', 'member'
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, entity_type, entity_id, role)
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(255),
  owner_type VARCHAR(20) NOT NULL, -- 'system', 'client', 'department', 'user'
  owner_id UUID,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  position INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id),
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'text', 'video', 'quiz', 'assignment'
  content JSON NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  status VARCHAR(20) DEFAULT 'enrolled', -- 'enrolled', 'completed', 'dropped'
  progress FLOAT DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE progress_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  score FLOAT,
  time_spent INTEGER, -- in seconds
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tables for authentication and token management

-- Refresh tokens for JWT authentication
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login attempts for rate limiting and account locking
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45), -- IPv6 can be up to 45 chars
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(last_name, first_name);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_entity ON user_roles(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_entity_role ON user_roles(user_id, entity_type, entity_id, role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON user_roles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_combined ON user_roles(user_id, entity_type, entity_id, role, status);

-- Client, department, and group indexes
CREATE INDEX IF NOT EXISTS idx_departments_client_id ON departments(client_id);
CREATE INDEX IF NOT EXISTS idx_groups_client_id ON groups(client_id);
CREATE INDEX IF NOT EXISTS idx_groups_department_id ON groups(department_id);

-- Authentication-related indexes
 
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id_not_revoked ON refresh_tokens(user_id) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_combined ON refresh_tokens(token, is_revoked, expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_combined ON password_reset_tokens(token, is_used, expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_active ON password_reset_tokens(user_id) WHERE is_used = FALSE;

-- Login attempts indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created_at ON login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_success ON login_attempts(email, success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_success_created ON login_attempts(email, success, created_at);

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_courses_owner ON courses(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_content_items_module_id ON content_items(module_id);
CREATE INDEX IF NOT EXISTS idx_courses_public ON courses(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_roles_entity ON user_roles(user_id, entity_type, entity_id, role, status);

-- Enrollment and progress indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_content_items_position ON content_items(module_id, position);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(user_id, course_id) WHERE status != 'dropped';

CREATE INDEX IF NOT EXISTS idx_progress_records_enrollment_id ON progress_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progress_records_content_item_id ON progress_records(content_item_id);
CREATE INDEX IF NOT EXISTS idx_progress_records_status ON progress_records(status);
CREATE INDEX IF NOT EXISTS idx_progress_records_combined ON progress_records(enrollment_id, content_item_id, status);

