-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.archived_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  file_format text NOT NULL DEFAULT 'original'::text,
  retention_until date,
  archive_notes text,
  archived_by uuid NOT NULL,
  archived_at timestamp with time zone DEFAULT now(),
  CONSTRAINT archived_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT archived_submissions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT archived_submissions_archived_by_fkey FOREIGN KEY (archived_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL DEFAULT 'UNKNOWN'::text,
  action_type text NOT NULL,
  submission_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  reviewer_name text,
  previous_status text,
  new_status text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT audit_logs_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.notifications (
  id text NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  submission_id text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'instructor'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  institution text,
  approval_status text NOT NULL DEFAULT 'approved'::text,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejected_reason text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_role text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'corrections_required'::text, 'no_corrections_required'::text, 'approved'::text, 'rejected'::text])),
  comments text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  review_type text DEFAULT 'primary'::text,
  review_order integer DEFAULT 1,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.submission_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  version integer NOT NULL DEFAULT 1,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submission_documents_pkey PRIMARY KEY (id),
  CONSTRAINT submission_documents_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT submission_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id text NOT NULL UNIQUE,
  title text,
  skill_area text NOT NULL,
  cohort text NOT NULL,
  test_date date NOT NULL,
  instructor_id uuid NOT NULL,
  instructor_email text NOT NULL,
  instructor_name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'::text,
  current_reviewer_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  skill_code text,
  cluster text,
  institution text,
  document_type text DEFAULT 'internal_moderation'::text CHECK (document_type = ANY (ARRAY['internal_moderation'::text, 'internal_validation'::text, 'external_validation'::text, 'training_plan'::text])),
  language_expert_id uuid,
  subject_expert_id uuid,
  senior_instructor_id uuid,
  workflow_step text DEFAULT 'submitted'::text,
  corrections_pending boolean DEFAULT false,
  parent_submission_id uuid,
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_current_reviewer_id_fkey FOREIGN KEY (current_reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_language_expert_id_fkey FOREIGN KEY (language_expert_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_subject_expert_id_fkey FOREIGN KEY (subject_expert_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_senior_instructor_id_fkey FOREIGN KEY (senior_instructor_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_parent_submission_id_fkey FOREIGN KEY (parent_submission_id) REFERENCES public.submissions(id)
);