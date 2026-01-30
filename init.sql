--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    domain character varying(255),
    logo_url character varying(255),
    primary_color character varying(20),
    secondary_color character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: content_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content_type character varying(50) NOT NULL,
    content json NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    thumbnail_url character varying(255),
    owner_type character varying(20) NOT NULL,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    owner_id uuid
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    status character varying(20) DEFAULT 'enrolled'::character varying,
    progress double precision DEFAULT 0,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    department_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text
);


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    ip_address character varying(45),
    success boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    is_used boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: progress_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    enrollment_id uuid NOT NULL,
    content_item_id uuid NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying,
    score double precision,
    time_spent integer,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    attempts_data json
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    is_revoked boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    entity_type character varying(20) NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entity_id uuid
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    profile_image character varying(255),
    is_system_admin boolean DEFAULT false,
    is_individual_learner boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, type, domain, logo_url, primary_color, secondary_color, is_active, created_at, updated_at) FROM stdin;
6367c521-a810-4498-ae2b-b367778e5b1a	Acme University	school	acme.edu	\N	#3366CC	#66CC99	t	2025-04-04 06:47:21.110759	2025-04-04 06:47:21.110759
0ada19b9-c3d6-4b08-8323-8cd3261be791	Tech Training Corp	organization	techtraining.com	\N	#3366CC	#66CC99	t	2025-04-04 06:52:26.679076	2025-04-04 06:52:26.679076
e452702d-68f0-4eca-9c6b-4c4ed505b9d0	Tech University	school	techu.edu	https://storage.example.com/logos/techu.png	#4285F4	#34A853	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
4fa4d2e0-11ea-4e39-aad4-e820e136d668	Corporate Learning Inc	organization	corplearn.com	https://storage.example.com/logos/corplearn.png	#EA4335	#FBBC05	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
49990657-18a5-4d8f-9e79-cb5849e9cecb	Public School District	school	psd.edu	https://storage.example.com/logos/psd.png	#673AB7	#3F51B5	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_items (id, module_id, title, content_type, content, "position", created_at, updated_at) FROM stdin;
fe9df6ce-2c69-4ccc-9e63-c25bfcd44365	e76540be-084f-4845-955c-9f0093dfb20f	Introduction	text	{"text": "Welcome to this course!", "author": "Course Team", "created_date": "2025-03-24", "last_updated": "2025-04-09"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
aa45ab48-42bd-47c4-9bf0-b8503f1699db	f99a01ca-001c-4525-8676-a7368d4a58e5	Introduction	text	{"text": "Welcome to this course!", "author": "Sarah Johnson", "created_date": "2025-02-12", "last_updated": "2025-04-08"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
ca808a82-f85b-4d5d-8395-c159b7cb3ee7	f7af4c98-e2cf-458c-a1f8-6cb4f5aa681e	Introduction	text	{"text": "Welcome to this course!", "author": "Dr. Martinez", "created_date": "2025-04-10", "last_updated": "2025-03-25"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
66a248d2-4caf-4544-a971-1975fb427d29	30ec10ef-0718-460a-ae27-7fdcf28200a9	Introduction	text	{"text": "Welcome to this course!", "author": "Course Team", "created_date": "2025-02-12", "last_updated": "2025-03-23"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
6eb07aa4-8a29-4984-8460-1715215ccf3a	b0135cc3-c69c-4149-9c34-548da1982207	Introduction	text	{"text": "Welcome to this course!", "author": "Course Team", "created_date": "2025-02-28", "last_updated": "2025-04-10"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
0d7ea27e-b77e-4782-aab2-bd7c7e3edc3a	4813943b-2031-4de2-8bff-b4a052a47952	Introduction	text	{"text": "Welcome to this course!", "author": "Sarah Johnson", "created_date": "2025-03-07", "last_updated": "2025-04-04"}	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
bdd40507-bb9c-497d-a3cb-356985b31318	f71f1b90-f38c-482a-bc9a-c120054315c6	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Sarah Johnson", "created_date": "2025-03-09", "last_updated": "2025-04-06"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
f125a006-d59a-4cf7-bea6-aa006dae7add	4d982bfb-5da5-4dce-b525-18da05f186b8	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-01-13", "last_updated": "2025-03-28"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ddf30fd2-85b4-4ec0-b6c5-cea1ededfb75	443ac108-6c44-46e9-935c-57870ec1dd62	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Dr. Martinez", "created_date": "2025-01-22", "last_updated": "2025-04-07"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
8f167036-e77b-49c0-a8a5-9d7eff9d4eb7	4cccb771-36af-4724-bf70-0da1040a266e	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-02-08", "last_updated": "2025-04-07"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
f2d32992-d035-4c7a-99a8-82051ca82770	3980baed-f92d-4dda-b795-995f4ff848b3	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Sarah Johnson", "created_date": "2025-02-09", "last_updated": "2025-04-06"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5efe234d-7798-4709-b35f-820b99e1f3d3	505b2e3d-6676-4424-9ef6-bd5188c28a1d	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Course Team", "created_date": "2025-03-20", "last_updated": "2025-03-30"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
999ce8e3-3eb0-4605-92e9-48fd9a8af2a2	09d9c74b-e6f2-4474-b9fd-dfaee9bce8ac	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Sarah Johnson", "created_date": "2025-03-13", "last_updated": "2025-04-05"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5140c148-32a2-4df0-bfa0-552d6f5cc899	db559047-4039-40f4-b7cf-088322b8a095	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Course Team", "created_date": "2025-04-05", "last_updated": "2025-03-24"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
f2215980-febb-449c-bc08-d13c3b8b9835	a22f000b-77d1-49d4-8f3a-858cf4bb0c7c	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-02-01", "last_updated": "2025-03-29"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ba960d66-9b51-4b16-873e-b6c7d95f209e	7713638f-2293-4113-be73-f56683babfd3	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Dr. Martinez", "created_date": "2025-01-18", "last_updated": "2025-04-03"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
1651cc98-37eb-4f2c-990e-8789725db494	43ace7bc-49ab-4c88-b7b0-f65111af3a56	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-03-02", "last_updated": "2025-04-04"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
c17e7f83-6b39-4905-83bc-f703157a6ee1	f3c5ead2-043e-4ffe-acc1-faf256bcac30	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Course Team", "created_date": "2025-01-27", "last_updated": "2025-04-01"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5c401917-f087-44a4-94a3-c2eac9fb32b4	03a6cd99-f954-43ea-94e0-86181de17139	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Dr. Martinez", "created_date": "2025-03-20", "last_updated": "2025-03-24"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ed01f542-3bde-488f-858f-c4aa97d59c3a	0c598114-ecb0-474c-ac74-73959d62c4fd	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Course Team", "created_date": "2025-03-25", "last_updated": "2025-03-27"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
940824c2-4ebd-47b2-99ec-8795ce2c9cd8	59781315-d1c8-434c-af41-56717c0ebd4f	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-02-24", "last_updated": "2025-04-01"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
dc4dd9e9-5c2b-488d-904e-bf5eb495d7d5	d4cec82d-a1ea-4483-ab4d-eb6af259c125	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Prof. Anderson", "created_date": "2025-02-01", "last_updated": "2025-04-08"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
3a932fe0-d015-4f3b-858d-b7d17dd9d47d	3a3687bd-112d-4e32-aab7-b0c73c1a9b1b	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Dr. Martinez", "created_date": "2025-01-24", "last_updated": "2025-03-25"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
dbac6827-e906-418f-a27a-74cf7f411e56	4f924565-a507-49e0-9991-761c4df7ece3	Introduction	text	{"text": "Welcome to this module! In this module, you'll learn the fundamentals that will prepare you for more advanced topics.", "author": "Course Team", "created_date": "2025-02-19", "last_updated": "2025-03-29"}	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
bb32ed50-0bb1-4817-a02c-414590436d22	03a6cd99-f954-43ea-94e0-86181de17139	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 368, "views": 1006, "duration": 720, "created_date": "2025-04-02", "engagement_rate": 0.16, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
451f1f97-84df-43a1-8ce7-069157c430d6	e76540be-084f-4845-955c-9f0093dfb20f	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 76, "views": 2945, "duration": 600, "created_date": "2024-12-19", "engagement_rate": 0.17, "transcript_available": false}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
472291a4-ea84-4d68-b606-e126aa85fbd5	f99a01ca-001c-4525-8676-a7368d4a58e5	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 290, "views": 981, "duration": 600, "created_date": "2025-01-31", "engagement_rate": 0.23, "transcript_available": false}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
6bd5e2d0-b869-4de7-a978-19b225ed95c5	f7af4c98-e2cf-458c-a1f8-6cb4f5aa681e	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 72, "views": 2020, "duration": 600, "created_date": "2025-01-13", "engagement_rate": 0.20, "transcript_available": true}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
e7bc8e19-8711-4fba-a5bc-b9e064138fbd	30ec10ef-0718-460a-ae27-7fdcf28200a9	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 217, "views": 2057, "duration": 600, "created_date": "2025-01-18", "engagement_rate": 0.29, "transcript_available": true}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
af92380c-e9f2-4d2a-8d84-59d6ef2962a0	b0135cc3-c69c-4149-9c34-548da1982207	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 307, "views": 1598, "duration": 600, "created_date": "2025-03-14", "engagement_rate": 0.25, "transcript_available": false}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
92473384-a521-4342-bee9-a9eb34210988	4813943b-2031-4de2-8bff-b4a052a47952	First Steps	video	{"url": "https://example.com/video1.mp4", "likes": 175, "views": 559, "duration": 600, "created_date": "2025-01-06", "engagement_rate": 0.15, "transcript_available": true}	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
148fbf1b-c020-4e1e-98a9-d8c6be055311	f71f1b90-f38c-482a-bc9a-c120054315c6	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 200, "views": 1839, "duration": 720, "created_date": "2025-02-07", "engagement_rate": 0.20, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
730e464e-ffcf-4831-8911-dcdc08a6750e	4d982bfb-5da5-4dce-b525-18da05f186b8	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 381, "views": 422, "duration": 720, "created_date": "2025-01-25", "engagement_rate": 0.19, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
1eb0faf0-5cb1-4e2d-834e-f33588a4f227	443ac108-6c44-46e9-935c-57870ec1dd62	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 183, "views": 687, "duration": 720, "created_date": "2025-02-21", "engagement_rate": 0.29, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
50d22ecb-2f38-4dc2-bdfe-512ed529ff5d	4cccb771-36af-4724-bf70-0da1040a266e	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 488, "views": 1578, "duration": 720, "created_date": "2025-03-20", "engagement_rate": 0.31, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
0385f05b-c9b3-4014-a6fb-c24a830b6b4b	3980baed-f92d-4dda-b795-995f4ff848b3	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 390, "views": 1669, "duration": 720, "created_date": "2025-02-19", "engagement_rate": 0.22, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5700be83-3d60-4c08-8ef1-ace96d63dbf0	505b2e3d-6676-4424-9ef6-bd5188c28a1d	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 167, "views": 3070, "duration": 720, "created_date": "2025-01-05", "engagement_rate": 0.34, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
dfc1e991-681b-492e-96c4-e2e977cebfdd	09d9c74b-e6f2-4474-b9fd-dfaee9bce8ac	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 344, "views": 2981, "duration": 720, "created_date": "2025-02-17", "engagement_rate": 0.19, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
19675ce9-4075-4830-bee7-01484e8385a0	db559047-4039-40f4-b7cf-088322b8a095	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 10, "views": 4095, "duration": 720, "created_date": "2025-02-22", "engagement_rate": 0.22, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
4bcfd6ff-5852-4545-b06e-ec95b5a6e9fa	a22f000b-77d1-49d4-8f3a-858cf4bb0c7c	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 295, "views": 3518, "duration": 720, "created_date": "2025-03-16", "engagement_rate": 0.29, "transcript_available": false}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
910746cc-4c5d-4d86-b125-2f1b18f6a941	7713638f-2293-4113-be73-f56683babfd3	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 319, "views": 3885, "duration": 720, "created_date": "2025-04-03", "engagement_rate": 0.13, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
595c97d3-4213-4638-a89b-d45e39ae33c6	43ace7bc-49ab-4c88-b7b0-f65111af3a56	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 325, "views": 876, "duration": 720, "created_date": "2024-12-18", "engagement_rate": 0.16, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
6ea9354c-9771-4583-afa0-c9d711ccfc71	f3c5ead2-043e-4ffe-acc1-faf256bcac30	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 469, "views": 567, "duration": 720, "created_date": "2025-03-17", "engagement_rate": 0.32, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
029cf6fe-d09b-4e0e-a719-8af189bb05b5	0c598114-ecb0-474c-ac74-73959d62c4fd	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 309, "views": 2899, "duration": 720, "created_date": "2025-03-12", "engagement_rate": 0.25, "transcript_available": false}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
e62783cf-bec3-4cdf-9fc6-bbdb1938ca1e	59781315-d1c8-434c-af41-56717c0ebd4f	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 161, "views": 1307, "duration": 720, "created_date": "2025-04-04", "engagement_rate": 0.20, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
819fdd97-c219-4981-a3a1-9d8f8b2c0863	d4cec82d-a1ea-4483-ab4d-eb6af259c125	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 143, "views": 3996, "duration": 720, "created_date": "2025-01-02", "engagement_rate": 0.16, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
94c02539-91c5-4b50-9029-95f9113a7633	3a3687bd-112d-4e32-aab7-b0c73c1a9b1b	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 317, "views": 1358, "duration": 720, "created_date": "2025-03-21", "engagement_rate": 0.17, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
6b2d2603-8ed2-4e8a-bb37-dd7072cb2ecf	4f924565-a507-49e0-9991-761c4df7ece3	Video Overview	video	{"url": "https://example.com/videos/overview.mp4", "likes": 106, "views": 2037, "duration": 720, "created_date": "2025-03-16", "engagement_rate": 0.34, "transcript_available": true}	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
dfa9fa1b-eccf-4950-a406-471bd95ae447	f99a01ca-001c-4525-8676-a7368d4a58e5	Basic Quiz	quiz	{"questions": [{"text": "What is programming?", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}], "show_results": true, "passing_score": 71, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
7b5351e2-c6ec-4c05-91b0-0e0d61037ff5	f7af4c98-e2cf-458c-a1f8-6cb4f5aa681e	Basic Quiz	quiz	{"questions": [{"text": "What is programming?", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}], "show_results": true, "passing_score": 64, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
06aa035f-347f-4da0-8e3a-b625f5070d08	30ec10ef-0718-460a-ae27-7fdcf28200a9	Basic Quiz	quiz	{"questions": [{"text": "What is programming?", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}], "show_results": false, "passing_score": 77, "attempts_allowed": 2, "shuffle_questions": false, "time_limit_minutes": 30}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
7352da4d-d416-40a5-9f4d-d93d1c401a2f	b0135cc3-c69c-4149-9c34-548da1982207	Basic Quiz	quiz	{"questions": [{"text": "What is programming?", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}], "show_results": true, "passing_score": 74, "attempts_allowed": 2, "shuffle_questions": false, "time_limit_minutes": 45}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
727d531f-f9a0-48ff-8d85-b74d1d547fbd	4813943b-2031-4de2-8bff-b4a052a47952	Basic Quiz	quiz	{"questions": [{"text": "What is programming?", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}], "show_results": false, "passing_score": 78, "attempts_allowed": 1, "shuffle_questions": false, "time_limit_minutes": 45}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
dce78c55-8b85-4a24-a96d-f0b970d6de61	f71f1b90-f38c-482a-bc9a-c120054315c6	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 68, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 15}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
a0de1eea-1a2b-4ff4-b794-092291ba1fd9	4d982bfb-5da5-4dce-b525-18da05f186b8	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 74, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 20}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
10e0f308-c068-458b-ba16-0956751a54a3	443ac108-6c44-46e9-935c-57870ec1dd62	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 64, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 15}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
8244a685-3560-4693-b89b-1e5cdf0ffaba	4cccb771-36af-4724-bf70-0da1040a266e	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 63, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 15}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
c9aee535-bd21-4a46-b5c4-bc4429d3f159	3980baed-f92d-4dda-b795-995f4ff848b3	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 73, "attempts_allowed": 2, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
440d03d2-b236-4ece-ada4-0444ee829d6b	505b2e3d-6676-4424-9ef6-bd5188c28a1d	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 70, "attempts_allowed": 2, "shuffle_questions": true, "time_limit_minutes": 20}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
a04f8225-6d53-4e59-a510-66e8c3f75ceb	09d9c74b-e6f2-4474-b9fd-dfaee9bce8ac	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 78, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
3318eefa-5263-482d-af86-7f51590d0181	db559047-4039-40f4-b7cf-088322b8a095	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 68, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 20}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
f0ea5ec1-2e90-4517-82db-01c28235b292	a22f000b-77d1-49d4-8f3a-858cf4bb0c7c	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 65, "attempts_allowed": 2, "shuffle_questions": false, "time_limit_minutes": 20}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ee7508ea-8446-46fd-87bb-4be3a0aaddee	7713638f-2293-4113-be73-f56683babfd3	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 68, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
517be8b3-aac8-4727-a158-495014c1f775	43ace7bc-49ab-4c88-b7b0-f65111af3a56	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 63, "attempts_allowed": 2, "shuffle_questions": true, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
3e154791-b4df-412b-b65b-f878424bacf6	f3c5ead2-043e-4ffe-acc1-faf256bcac30	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 65, "attempts_allowed": 2, "shuffle_questions": false, "time_limit_minutes": 15}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
7b87ac56-8c17-481c-8171-13fd1bed3e52	03a6cd99-f954-43ea-94e0-86181de17139	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 60, "attempts_allowed": 1, "shuffle_questions": false, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
7267ae46-2874-43b3-b280-9d2f518ad113	0c598114-ecb0-474c-ac74-73959d62c4fd	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 60, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
a590028f-4ca1-4e71-8662-0e8fac1d8222	59781315-d1c8-434c-af41-56717c0ebd4f	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 64, "attempts_allowed": 2, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
6b9a3f8d-0e8e-49d6-8b66-b2ec72227f11	d4cec82d-a1ea-4483-ab4d-eb6af259c125	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": false, "passing_score": 75, "attempts_allowed": 3, "shuffle_questions": true, "time_limit_minutes": 30}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ac637e07-cc6c-426f-bf19-78e1f2ca7d3a	3a3687bd-112d-4e32-aab7-b0c73c1a9b1b	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 60, "attempts_allowed": 1, "shuffle_questions": true, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
8c9e4992-d5b7-4401-8552-c21ad907eb92	4f924565-a507-49e0-9991-761c4df7ece3	Knowledge Check	quiz	{"questions": [{"text": "Which of the following is correct?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 2}, {"text": "What is the primary purpose of this module?", "options": ["Entertainment", "Learning fundamentals", "Advanced concepts", "Project work"], "correctAnswer": 1}], "show_results": true, "passing_score": 67, "attempts_allowed": 2, "shuffle_questions": true, "time_limit_minutes": 45}	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
2242b64a-66a1-4870-b370-4b34a1e87c22	3a3687bd-112d-4e32-aab7-b0c73c1a9b1b	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 49, "grammar": 13, "creativity": 21, "formatting": 23}, "dueDate": "2025-05-09", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
95cdf569-2d03-4401-9a84-0bf1711a3000	e76540be-084f-4845-955c-9f0093dfb20f	Basic Quiz	quiz	{"due_date": "2025-04-10", "duration": 15, "questions": [{"text": "What is programming?", "type": "mcq", "options": ["Writing code", "Creating websites", "Both A and B", "None of the above"], "correctAnswer": 2}, {"text": "HTML stands for Hyper Text Markup Language.", "type": "true_false", "correctAnswer": true}, {"text": "Complete the sentence: The CPU is the ______ of the computer.", "type": "fill_blank", "correctAnswer": "brain"}, {"text": "Which of the following is a programming language?", "type": "mcq", "options": ["Python", "Elephant", "Photoshop", "Google"], "correctAnswer": 0}], "show_results": true, "passing_score": 63, "attempts_allowed": 1, "shuffle_questions": false}	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
cd935232-0695-4187-a5bc-d8bafc44df8c	f71f1b90-f38c-482a-bc9a-c120054315c6	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 30, "grammar": 17, "creativity": 16, "formatting": 27}, "dueDate": null, "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf", "docx", "txt"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
fcef20ba-2626-45e6-a7f0-018077662759	4d982bfb-5da5-4dce-b525-18da05f186b8	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 35, "grammar": 20, "creativity": 36, "formatting": 16}, "dueDate": "2025-05-07", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 3, "group_submission": true, "submission_format": ["pdf", "docx", "txt"], "late_penalty_percent": 10, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
925e28d7-03d6-4358-ac6d-a4dbaf0683e5	443ac108-6c44-46e9-935c-57870ec1dd62	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 48, "grammar": 15, "creativity": 32, "formatting": 23}, "dueDate": "2025-04-17", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": true, "submission_format": ["pdf", "docx", "txt", "zip"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
2331c6e9-ce15-412f-a439-f92a284147dd	4cccb771-36af-4724-bf70-0da1040a266e	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 40, "grammar": 18, "creativity": 34, "formatting": 24}, "dueDate": null, "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf", "docx", "txt"], "late_penalty_percent": 10, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
54bcdc08-a1c6-4e38-9c4f-194f438bea2c	3980baed-f92d-4dda-b795-995f4ff848b3	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 48, "grammar": 22, "creativity": 38, "formatting": 27}, "dueDate": "2025-04-25", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 10, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
912a9553-622f-4878-bed6-6c049011b3b1	505b2e3d-6676-4424-9ef6-bd5188c28a1d	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 34, "grammar": 18, "creativity": 24, "formatting": 25}, "dueDate": "2025-04-12", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
a4cff51d-3b2c-43a5-888f-64fc8c4c2418	09d9c74b-e6f2-4474-b9fd-dfaee9bce8ac	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 40, "grammar": 24, "creativity": 27, "formatting": 21}, "dueDate": "2025-05-07", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 20, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
b0de6d44-f1cc-4dc8-a804-a4cd1fb5c73b	db559047-4039-40f4-b7cf-088322b8a095	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 35, "grammar": 23, "creativity": 36, "formatting": 24}, "dueDate": "2025-04-22", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": true, "submission_format": ["pdf", "docx", "txt", "zip"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5e9165ec-6937-4f0e-905d-604f61a2f0f7	a22f000b-77d1-49d4-8f3a-858cf4bb0c7c	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 43, "grammar": 18, "creativity": 37, "formatting": 16}, "dueDate": null, "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": true, "submission_format": ["pdf"], "late_penalty_percent": 20, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
a74b3981-072d-496c-80e8-f5f1036f9fda	7713638f-2293-4113-be73-f56683babfd3	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 37, "grammar": 24, "creativity": 37, "formatting": 23}, "dueDate": "2025-04-13", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf"], "late_penalty_percent": 10, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
e0f00c19-ac18-42b6-a52b-3734de563f27	43ace7bc-49ab-4c88-b7b0-f65111af3a56	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 32, "grammar": 19, "creativity": 16, "formatting": 19}, "dueDate": "2025-04-27", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf", "docx", "txt"], "late_penalty_percent": 20, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
77e771e2-f3d4-4413-998a-6181c9f06f88	f3c5ead2-043e-4ffe-acc1-faf256bcac30	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 44, "grammar": 18, "creativity": 13, "formatting": 25}, "dueDate": "2025-04-23", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf", "docx", "txt", "zip"], "late_penalty_percent": 10, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
865f6636-d625-4900-bcaa-25ccb7d82da8	03a6cd99-f954-43ea-94e0-86181de17139	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 34, "grammar": 13, "creativity": 36, "formatting": 20}, "dueDate": "2025-04-29", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 3, "group_submission": true, "submission_format": ["pdf"], "late_penalty_percent": 10, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
2bb8da02-59d0-4def-95bd-f49371c047fa	0c598114-ecb0-474c-ac74-73959d62c4fd	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 39, "grammar": 12, "creativity": 31, "formatting": 23}, "dueDate": "2025-04-26", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 20, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
e392a4b2-af19-4dce-bcac-bfaca4fb798a	59781315-d1c8-434c-af41-56717c0ebd4f	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 42, "grammar": 11, "creativity": 17, "formatting": 25}, "dueDate": null, "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 1, "group_submission": false, "submission_format": ["pdf"], "late_penalty_percent": 10, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
999e8c93-89d5-4b73-8529-0c2779e0428c	d4cec82d-a1ea-4483-ab4d-eb6af259c125	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 49, "grammar": 13, "creativity": 22, "formatting": 25}, "dueDate": "2025-05-01", "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 2, "group_submission": false, "submission_format": ["pdf"], "late_penalty_percent": 20, "allow_late_submissions": true}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
66bdd437-0efb-4e33-8407-d743c173d555	4f924565-a507-49e0-9991-761c4df7ece3	Practical Exercise	assignment	{"points": 100, "rubric": {"content": 35, "grammar": 12, "creativity": 24, "formatting": 28}, "dueDate": null, "instructions": "Complete the following exercises and submit your work.", "attempts_allowed": 3, "group_submission": false, "submission_format": ["pdf", "docx"], "late_penalty_percent": 10, "allow_late_submissions": false}	4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, title, description, thumbnail_url, owner_type, is_public, created_at, updated_at, owner_id) FROM stdin;
ab4472a5-def2-4106-b472-8ba3d4b9fa90	Introduction to Programming	Learn the basics of programming with JavaScript	\N	system	t	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
fcd4d80b-f605-4bcf-927d-f470a0f7844e	Web Development Fundamentals	HTML, CSS, and JavaScript for beginners	\N	client	f	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	6367c521-a810-4498-ae2b-b367778e5b1a
80abcf32-bbee-4671-9f44-fefde917eef5	Introduction to Programming	Learn the fundamentals of programming with Python	https://storage.example.com/thumbnails/intro_programming.jpg	system	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
00e3589f-64ba-4069-9a0c-574760e84033	Web Development Bootcamp	Complete guide to modern web development	https://storage.example.com/thumbnails/web_dev.jpg	system	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
8f781880-b071-4f55-9ca8-cf527962e89b	Data Science Essentials	Learn data analysis and visualization techniques	https://storage.example.com/thumbnails/data_science.jpg	system	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
dba4b3b6-4f36-4bb2-8bb9-3ad311b86827	Computer Science 101	Introduction to computer science concepts	https://storage.example.com/thumbnails/cs101.jpg	client	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	e452702d-68f0-4eca-9c6b-4c4ed505b9d0
db8cc9e4-c2f1-4db3-8037-0c5d2bfad77d	Sales Techniques	Modern sales strategies and techniques	https://storage.example.com/thumbnails/sales.jpg	client	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	4fa4d2e0-11ea-4e39-aad4-e820e136d668
f7a65fcd-7623-4a4a-88de-299524cbf093	Elementary Science	Science curriculum for elementary students	https://storage.example.com/thumbnails/elem_science.jpg	client	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	49990657-18a5-4d8f-9e79-cb5849e9cecb
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, client_id, name, created_at, updated_at) FROM stdin;
96348488-5fcf-43f3-9349-9b3469472704	6367c521-a810-4498-ae2b-b367778e5b1a	Computer Science	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
3f07610e-902e-438b-b7e0-afc9e503dccd	6367c521-a810-4498-ae2b-b367778e5b1a	Business	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
2e0e0a74-2cb2-43ca-96cd-4b3360e94b41	0ada19b9-c3d6-4b08-8323-8cd3261be791	Computer Science	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
a735c22b-3829-4569-bd6d-a02a19eeb981	0ada19b9-c3d6-4b08-8323-8cd3261be791	Business	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
69903119-199c-4e31-94ea-12ab72a6f89f	e452702d-68f0-4eca-9c6b-4c4ed505b9d0	Computer Science	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5b700880-41bf-4f4a-8e8d-52b76f0c3311	e452702d-68f0-4eca-9c6b-4c4ed505b9d0	Mathematics	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
0a6412ca-eac4-480a-a787-c873485115d1	4fa4d2e0-11ea-4e39-aad4-e820e136d668	Sales	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
04048556-9e21-4eda-bf75-0bdf49516948	4fa4d2e0-11ea-4e39-aad4-e820e136d668	Product Development	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
b511bb95-edd6-4de5-8043-5343817eec57	49990657-18a5-4d8f-9e79-cb5849e9cecb	Elementary Education	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
66c73830-245f-419c-8211-735e9dbabc03	49990657-18a5-4d8f-9e79-cb5849e9cecb	Secondary Education	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollments (id, user_id, course_id, status, progress, enrolled_at, completed_at, updated_at) FROM stdin;
cefd4ed1-86f9-4734-8481-e327af7c7009	764f0b73-0fff-4588-a7de-084d88523c10	ab4472a5-def2-4106-b472-8ba3d4b9fa90	enrolled	0	2025-04-04 07:07:05.921779	\N	2025-04-04 07:07:05.921779
26b0ab4e-3c26-44c1-8307-0caae2674cba	2d453f9c-0680-4a0c-adde-b9802b303070	00e3589f-64ba-4069-9a0c-574760e84033	enrolled	0	2025-04-06 22:44:39.757765	\N	2025-04-06 22:44:39.757765
82076d93-c0da-4dee-b69f-e3d139678fe1	1263d4e7-ad3a-4df3-9031-7923c60b029b	db8cc9e4-c2f1-4db3-8037-0c5d2bfad77d	enrolled	0	2025-04-06 22:44:39.757765	\N	2025-04-06 22:44:39.757765
0f7abb3c-d553-41fb-9980-2c0adf7b37a5	dae47d36-d874-4936-8f40-a1dc95584035	8f781880-b071-4f55-9ca8-cf527962e89b	enrolled	0	2025-04-06 22:44:39.757765	\N	2025-04-06 22:44:39.757765
4fcb8800-9df6-47a0-b2da-70b542ddb12c	cb00dadb-f195-4ee4-b1bb-be24cf2eab80	ab4472a5-def2-4106-b472-8ba3d4b9fa90	enrolled	0.33	2025-04-06 22:44:39.757765	\N	2025-04-06 22:44:39.757765
dbe8f0e3-8a4b-49e8-995f-fec8568ceb8a	cb00dadb-f195-4ee4-b1bb-be24cf2eab80	dba4b3b6-4f36-4bb2-8bb9-3ad311b86827	enrolled	0.33	2025-04-06 22:44:39.757765	\N	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, client_id, department_id, name, created_at, updated_at, description) FROM stdin;
14dfefe9-873f-4318-91bf-662205dfbfef	6367c521-a810-4498-ae2b-b367778e5b1a	96348488-5fcf-43f3-9349-9b3469472704	Section A	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
4e3f75ea-5d0b-48f0-a9dd-cb233fe625d8	6367c521-a810-4498-ae2b-b367778e5b1a	96348488-5fcf-43f3-9349-9b3469472704	Section B	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
7e216b46-5396-4cf9-ba00-34bc0bd12867	6367c521-a810-4498-ae2b-b367778e5b1a	3f07610e-902e-438b-b7e0-afc9e503dccd	Section A	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
58a0f011-fee5-444e-8dab-711753838451	6367c521-a810-4498-ae2b-b367778e5b1a	3f07610e-902e-438b-b7e0-afc9e503dccd	Section B	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
d87708ad-0b28-4f52-b5cf-5153cc1461ac	0ada19b9-c3d6-4b08-8323-8cd3261be791	2e0e0a74-2cb2-43ca-96cd-4b3360e94b41	Section A	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
d785d213-9928-40be-92c1-c56c0e2f9129	0ada19b9-c3d6-4b08-8323-8cd3261be791	2e0e0a74-2cb2-43ca-96cd-4b3360e94b41	Section B	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
816cc44a-c977-47f4-ab48-2f82e6f3e2e1	0ada19b9-c3d6-4b08-8323-8cd3261be791	a735c22b-3829-4569-bd6d-a02a19eeb981	Section A	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
98652111-5616-4872-b731-e3dfeaa3d1b3	0ada19b9-c3d6-4b08-8323-8cd3261be791	a735c22b-3829-4569-bd6d-a02a19eeb981	Section B	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
640af9c8-e35b-4de4-beb2-024a35983075	e452702d-68f0-4eca-9c6b-4c4ed505b9d0	69903119-199c-4e31-94ea-12ab72a6f89f	Freshmen	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
739762f4-d833-4284-8682-acd18ce515ab	e452702d-68f0-4eca-9c6b-4c4ed505b9d0	69903119-199c-4e31-94ea-12ab72a6f89f	Sophomore	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
a9a0b4f4-33fc-4a68-ba73-5ad8a618ee5a	e452702d-68f0-4eca-9c6b-4c4ed505b9d0	5b700880-41bf-4f4a-8e8d-52b76f0c3311	Algebra Group	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
fb61dbdb-72c1-4b40-acde-0afb11dd4708	4fa4d2e0-11ea-4e39-aad4-e820e136d668	0a6412ca-eac4-480a-a787-c873485115d1	Team North	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
4e634ef8-8904-49c5-bb25-07efa6fa493b	4fa4d2e0-11ea-4e39-aad4-e820e136d668	0a6412ca-eac4-480a-a787-c873485115d1	Team East	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
ef761582-7381-4630-9dd4-80394d7bf166	4fa4d2e0-11ea-4e39-aad4-e820e136d668	04048556-9e21-4eda-bf75-0bdf49516948	Mobile Team	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
f9ab9fb4-1d4a-4f54-933e-c91e0a5bdc81	49990657-18a5-4d8f-9e79-cb5849e9cecb	b511bb95-edd6-4de5-8043-5343817eec57	Grade 3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
c61aebd2-5456-4a3b-b28b-e0d09b65a95a	49990657-18a5-4d8f-9e79-cb5849e9cecb	b511bb95-edd6-4de5-8043-5343817eec57	Grade 4	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
6d07a70d-f5a8-4918-933e-ceecec020bd3	49990657-18a5-4d8f-9e79-cb5849e9cecb	66c73830-245f-419c-8211-735e9dbabc03	Physics Class	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.login_attempts (id, email, ip_address, success, created_at) FROM stdin;
aac20175-b302-4449-b946-3478179a56b1	admin@example.com	::1	t	2025-04-04 21:11:08.741346
9ecb0cee-3f59-4d4f-8a31-39c518c18cdd	admin@example.com	::1	t	2025-04-04 21:54:36.600608
b25b3faf-9aa0-4a0f-a61e-4cedbfd3c0ea	admin@example.com	::1	t	2025-04-04 22:10:34.098975
785d8ec6-64e6-4174-987b-0173f4474e74	admin@example.com	::1	t	2025-04-04 22:56:39.565802
f5a804e2-be2e-424a-8a86-4625e4d9336e	admin@example.com	::1	t	2025-04-04 23:09:43.586835
9530c582-408b-4d66-8e3a-8dda0b3e0081	admin@example.com	::1	t	2025-04-04 23:10:04.707159
fb1205dc-f852-4578-b2b3-acf9c6ba670c	admin@example.com	192.168.1.1	t	2025-04-06 22:44:39.757765
0eca53f9-543d-44ac-a22d-e3288d3cd117	student1@techu.edu	192.168.1.100	t	2025-04-06 22:44:39.757765
a52a847c-512c-4ca4-acfd-0921d23f37ef	unknown@example.com	192.168.1.200	f	2025-04-06 22:44:39.757765
6fd5e5c6-b142-4b83-ac77-87b9c625284c	unknown@example.com	192.168.1.200	f	2025-04-06 22:44:39.757765
7dc39124-c0bd-44e5-b680-6f13ad132fe4	learner@example.com	192.168.1.150	f	2025-04-06 22:44:39.757765
9b834d8e-e2d6-4f1b-8eff-031872fccd92	learner@example.com	192.168.1.150	t	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modules (id, course_id, title, "position", created_at, updated_at, description) FROM stdin;
e76540be-084f-4845-955c-9f0093dfb20f	ab4472a5-def2-4106-b472-8ba3d4b9fa90	Getting Started	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
f99a01ca-001c-4525-8676-a7368d4a58e5	ab4472a5-def2-4106-b472-8ba3d4b9fa90	Core Concepts	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
f7af4c98-e2cf-458c-a1f8-6cb4f5aa681e	ab4472a5-def2-4106-b472-8ba3d4b9fa90	Advanced Topics	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
30ec10ef-0718-460a-ae27-7fdcf28200a9	fcd4d80b-f605-4bcf-927d-f470a0f7844e	Getting Started	1	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
b0135cc3-c69c-4149-9c34-548da1982207	fcd4d80b-f605-4bcf-927d-f470a0f7844e	Core Concepts	2	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
4813943b-2031-4de2-8bff-b4a052a47952	fcd4d80b-f605-4bcf-927d-f470a0f7844e	Advanced Topics	3	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	\N
f71f1b90-f38c-482a-bc9a-c120054315c6	80abcf32-bbee-4671-9f44-fefde917eef5	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
4d982bfb-5da5-4dce-b525-18da05f186b8	80abcf32-bbee-4671-9f44-fefde917eef5	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
443ac108-6c44-46e9-935c-57870ec1dd62	80abcf32-bbee-4671-9f44-fefde917eef5	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
4cccb771-36af-4724-bf70-0da1040a266e	00e3589f-64ba-4069-9a0c-574760e84033	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
3980baed-f92d-4dda-b795-995f4ff848b3	00e3589f-64ba-4069-9a0c-574760e84033	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
505b2e3d-6676-4424-9ef6-bd5188c28a1d	00e3589f-64ba-4069-9a0c-574760e84033	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
09d9c74b-e6f2-4474-b9fd-dfaee9bce8ac	8f781880-b071-4f55-9ca8-cf527962e89b	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
db559047-4039-40f4-b7cf-088322b8a095	8f781880-b071-4f55-9ca8-cf527962e89b	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
a22f000b-77d1-49d4-8f3a-858cf4bb0c7c	8f781880-b071-4f55-9ca8-cf527962e89b	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
7713638f-2293-4113-be73-f56683babfd3	dba4b3b6-4f36-4bb2-8bb9-3ad311b86827	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
43ace7bc-49ab-4c88-b7b0-f65111af3a56	dba4b3b6-4f36-4bb2-8bb9-3ad311b86827	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
f3c5ead2-043e-4ffe-acc1-faf256bcac30	dba4b3b6-4f36-4bb2-8bb9-3ad311b86827	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
03a6cd99-f954-43ea-94e0-86181de17139	db8cc9e4-c2f1-4db3-8037-0c5d2bfad77d	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
0c598114-ecb0-474c-ac74-73959d62c4fd	db8cc9e4-c2f1-4db3-8037-0c5d2bfad77d	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
59781315-d1c8-434c-af41-56717c0ebd4f	db8cc9e4-c2f1-4db3-8037-0c5d2bfad77d	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
d4cec82d-a1ea-4483-ab4d-eb6af259c125	f7a65fcd-7623-4a4a-88de-299524cbf093	Getting Started	1	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
3a3687bd-112d-4e32-aab7-b0c73c1a9b1b	f7a65fcd-7623-4a4a-88de-299524cbf093	Core Concepts	2	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
4f924565-a507-49e0-9991-761c4df7ece3	f7a65fcd-7623-4a4a-88de-299524cbf093	Advanced Topics	3	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, is_used, expires_at, created_at) FROM stdin;
01d49e70-9866-4e00-83ad-8badd84f0731	dae47d36-d874-4936-8f40-a1dc95584035	reset-token-b9356aea	f	2025-04-07 22:44:39.757765	2025-04-06 22:44:39.757765
\.


--
-- Data for Name: progress_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.progress_records (id, enrollment_id, content_item_id, status, score, time_spent, completed_at, created_at, updated_at, attempts_data) FROM stdin;
7f087883-83a1-4075-838f-5cfab4655c7a	4fcb8800-9df6-47a0-b2da-70b542ddb12c	fe9df6ce-2c69-4ccc-9e63-c25bfcd44365	completed	\N	450	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	{"attempts" : [{"attempt_number" : 1, "started_at" : "2025-04-06 22:44:39.757765", "viewed" : true, "time_spent" : 450}], "total_attempts" : 1, "best_score" : 0, "last_attempt_at" : "2025-04-06 22:44:39.757765"}
52cefe87-d399-4fae-8cc9-3aa32c64fabd	dbe8f0e3-8a4b-49e8-995f-fec8568ceb8a	ba960d66-9b51-4b16-873e-b6c7d95f209e	completed	\N	450	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	{"attempts" : [{"attempt_number" : 1, "started_at" : "2025-04-06 22:44:39.757765", "viewed" : true, "time_spent" : 450}], "total_attempts" : 1, "best_score" : 0, "last_attempt_at" : "2025-04-06 22:44:39.757765"}
466feaa6-3c62-4fbf-a658-a91791515d34	4fcb8800-9df6-47a0-b2da-70b542ddb12c	451f1f97-84df-43a1-8ce7-069157c430d6	in_progress	\N	200	\N	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	{"attempts" : [{"attempt_number" : 1, "started_at" : "2025-04-06 22:44:39.757765", "position" : 200, "duration" : 600}], "total_attempts" : 1, "best_score" : 0, "last_attempt_at" : "2025-04-06 22:44:39.757765"}
9ea902dc-0208-4629-a148-a1e935858a7f	dbe8f0e3-8a4b-49e8-995f-fec8568ceb8a	910746cc-4c5d-4d86-b125-2f1b18f6a941	in_progress	\N	200	\N	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	{"attempts" : [{"attempt_number" : 1, "started_at" : "2025-04-06 22:44:39.757765", "position" : 200, "duration" : 720}], "total_attempts" : 1, "best_score" : 0, "last_attempt_at" : "2025-04-06 22:44:39.757765"}
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token, is_revoked, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, entity_type, role, status, created_at, updated_at, entity_id) FROM stdin;
c51a25e3-9ece-4a45-8e44-6dc5a9ea9784	ad485a8c-9d39-4b61-8d11-66fd54fd0fac	client	instructor	active	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	6367c521-a810-4498-ae2b-b367778e5b1a
96ba27a5-7885-43d0-92a4-65b951e2d626	764f0b73-0fff-4588-a7de-084d88523c10	client	student	active	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779	6367c521-a810-4498-ae2b-b367778e5b1a
23c6e952-78fd-4714-8a90-16c24c902339	174d2eea-2bf0-4ea9-a6e7-bda564d0779e	department	admin	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	69903119-199c-4e31-94ea-12ab72a6f89f
8c0d34ed-293d-4593-a7df-3995326b85d4	ca088b26-f805-44d2-bc90-46b950f3208d	department	admin	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	5b700880-41bf-4f4a-8e8d-52b76f0c3311
a7fe5efa-2982-4d8e-97e9-61feb16234f5	5b77c00e-a380-4f93-8cef-73fefa89a987	department	instructor	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	69903119-199c-4e31-94ea-12ab72a6f89f
9ab539c2-01f7-48b0-bdf8-da62ae8d191e	2d453f9c-0680-4a0c-adde-b9802b303070	department	student	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	5b700880-41bf-4f4a-8e8d-52b76f0c3311
847efa2a-3ae0-4880-8e94-60870bbbb97f	8587fd82-56de-436a-a546-64dac3743860	department	admin	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	0a6412ca-eac4-480a-a787-c873485115d1
2e8359ca-7465-4aa4-aa62-5d6b0841f301	99a066d0-cf7e-4326-a769-5393ccaf02f3	department	instructor	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	0a6412ca-eac4-480a-a787-c873485115d1
1752af3e-2e51-4312-ad92-2a7ae627e10f	1263d4e7-ad3a-4df3-9031-7923c60b029b	department	student	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	04048556-9e21-4eda-bf75-0bdf49516948
362ac218-e153-440e-90d5-691ae3df76a3	1a966f75-da41-4ec6-a158-4983e2c1435f	department	instructor	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	b511bb95-edd6-4de5-8043-5343817eec57
b6a73599-b260-4651-b098-ef2b7c9fd243	6e0fe98b-f096-4c1b-a77e-be442b2c3189	department	instructor	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	66c73830-245f-419c-8211-735e9dbabc03
af63190b-43a1-4663-b134-4e2da6bc0eea	cb00dadb-f195-4ee4-b1bb-be24cf2eab80	department	student	active	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765	69903119-199c-4e31-94ea-12ab72a6f89f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, first_name, last_name, profile_image, is_system_admin, is_individual_learner, created_at, updated_at) FROM stdin;
ad485a8c-9d39-4b61-8d11-66fd54fd0fac	instructor@example.com	$2a$10$MXqtH9I04yNPcW25nhCwKOSGI7YvoMHc.hSt9LXyyB8uKP.U9fJlO	John	Teacher	\N	f	t	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
764f0b73-0fff-4588-a7de-084d88523c10	student@example.com	$2a$10$j6A82zrWa.RJlPSEG5OfVO.L6WtZpeMT/Uopqj3SkckAb15B4rXnW	Jane	Student	\N	f	t	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
be70e274-6886-44ea-a951-adc814a71048	admin@example.com	$2a$10$4zQUlTxylz1ajdV8NwcMnOt2PgF8JeQyNPITdeF.5v64MopDyu7AS	System	Admin	\N	t	f	2025-04-04 07:07:05.921779	2025-04-04 07:07:05.921779
dae47d36-d874-4936-8f40-a1dc95584035	learner@example.com	$2a$10$F7/xiHCkqIOE.zxIDqJeouGye1rnNPH5RNWk09KTDyGBHnvv7ibj.	Individual	Learner	\N	f	t	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
174d2eea-2bf0-4ea9-a6e7-bda564d0779e	cs.admin@techu.edu	$2a$10$C3ofZhu0PMek2/LfxDp5EejTLMKrax4VFkp.ZuhH73lP.W4cqhHjm	Thomas	Johnson	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
ca088b26-f805-44d2-bc90-46b950f3208d	math.admin@techu.edu	$2a$10$283M1D54QuGEX3KMW7f1Y.nECViAPtzc3JBW6RlWjLCyOI.WmpcdK	Lisa	Wong	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
5b77c00e-a380-4f93-8cef-73fefa89a987	professor@techu.edu	$2a$10$a.xgeKApvCEh7lwjHngRcO.veyMz5KfpRGrydTZq/Nmj1MvOnIcby	Robert	Smith	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
2d453f9c-0680-4a0c-adde-b9802b303070	student2@techu.edu	$2a$10$XBiqNcuBmKyrjkc8NmyXQuSYIIb2XbbxaVA5UNd6gkp1Bp9G.9U6G	James	Wilson	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
8587fd82-56de-436a-a546-64dac3743860	hr.manager@corplearn.com	$2a$10$4kE9T1Hl.2zdudQJtBp7DeLQyBNcftoU/wOPEekWKfcn6mY3xIxGi	Patricia	Miller	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
99a066d0-cf7e-4326-a769-5393ccaf02f3	trainer@corplearn.com	$2a$10$/2NpGppaibpjPEVbU0QlLOSd6TNbMyx3/55JaEBps19BLZ7LX5TOy	Michael	Brown	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
1263d4e7-ad3a-4df3-9031-7923c60b029b	employee@corplearn.com	$2a$10$VDm23UK5Og8GGW1mqOuzR.u7MQOTanUbwZVo4tcXZVTSkdOZ7P9ni	Sarah	Taylor	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
1a966f75-da41-4ec6-a158-4983e2c1435f	teacher@psd.edu	$2a$10$6p8L30x.oXhAzAXGsK3YKOQTBAJ2Wn169eQ8wjXdzd51SACqR4a6O	David	Anderson	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
6e0fe98b-f096-4c1b-a77e-be442b2c3189	highschool.teacher@psd.edu	$2a$10$BB2bsrtH6j8bv.GcpU2uDu7SzoclJRjdPIVwiMwg4TTdj/Ag6B6dS	Jennifer	Martinez	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
cb00dadb-f195-4ee4-b1bb-be24cf2eab80	student1@techu.edu	$2a$10$z6.xXoAh/J627Aa/Iem1u.E6BK6v1utAfaEliIuXIUbvG8JibmMg2	Emma	Davis	\N	f	f	2025-04-06 22:44:39.757765	2025-04-06 22:44:39.757765
\.


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: departments departments_client_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_client_id_name_key UNIQUE (client_id, name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: progress_records progress_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_records
    ADD CONSTRAINT progress_records_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: clients unique_domain; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT unique_domain UNIQUE (domain);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_entity_type_entity_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_entity_type_entity_id_role_key UNIQUE (user_id, entity_type, entity_id, role);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_content_items_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_items_module_id ON public.content_items USING btree (module_id);


--
-- Name: idx_content_items_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_items_position ON public.content_items USING btree (module_id, "position");


--
-- Name: idx_courses_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_owner ON public.courses USING btree (owner_type, owner_id);


--
-- Name: idx_courses_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_public ON public.courses USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_departments_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_client_id ON public.departments USING btree (client_id);


--
-- Name: idx_enrollments_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_active ON public.enrollments USING btree (user_id, course_id) WHERE ((status)::text <> 'dropped'::text);


--
-- Name: idx_enrollments_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_user_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_user_course ON public.enrollments USING btree (user_id, course_id);


--
-- Name: idx_enrollments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_user_id ON public.enrollments USING btree (user_id);


--
-- Name: idx_groups_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_client_id ON public.groups USING btree (client_id);


--
-- Name: idx_groups_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_department_id ON public.groups USING btree (department_id);


--
-- Name: idx_login_attempts_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email ON public.login_attempts USING btree (email);


--
-- Name: idx_login_attempts_email_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email_created_at ON public.login_attempts USING btree (email, created_at);


--
-- Name: idx_login_attempts_email_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email_success ON public.login_attempts USING btree (email, success);


--
-- Name: idx_login_attempts_email_success_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email_success_created ON public.login_attempts USING btree (email, success, created_at);


--
-- Name: idx_modules_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);


--
-- Name: idx_password_reset_tokens_combined; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_combined ON public.password_reset_tokens USING btree (token, is_used, expires_at);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_active ON public.password_reset_tokens USING btree (user_id) WHERE (is_used = false);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_progress_records_combined; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_records_combined ON public.progress_records USING btree (enrollment_id, content_item_id, status);


--
-- Name: idx_progress_records_content_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_records_content_item_id ON public.progress_records USING btree (content_item_id);


--
-- Name: idx_progress_records_enrollment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_records_enrollment_id ON public.progress_records USING btree (enrollment_id);


--
-- Name: idx_progress_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_records_status ON public.progress_records USING btree (status);


--
-- Name: idx_refresh_tokens_combined; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_combined ON public.refresh_tokens USING btree (token, is_revoked, expires_at);


--
-- Name: idx_refresh_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_refresh_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_refresh_tokens_user_id_not_revoked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user_id_not_revoked ON public.refresh_tokens USING btree (user_id) WHERE (is_revoked = false);


--
-- Name: idx_user_roles_combined; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_combined ON public.user_roles USING btree (user_id, entity_type, entity_id, role, status);


--
-- Name: idx_user_roles_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_entity ON public.user_roles USING btree (entity_type, entity_id);


--
-- Name: idx_user_roles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_status ON public.user_roles USING btree (status);


--
-- Name: idx_user_roles_user_entity_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_entity_role ON public.user_roles USING btree (user_id, entity_type, entity_id, role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_name ON public.users USING btree (last_name, first_name);


--
-- Name: content_items content_items_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: departments departments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: groups groups_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: groups groups_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: progress_records progress_records_content_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_records
    ADD CONSTRAINT progress_records_content_item_id_fkey FOREIGN KEY (content_item_id) REFERENCES public.content_items(id);


--
-- Name: progress_records progress_records_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_records
    ADD CONSTRAINT progress_records_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

