--
-- PostgreSQL database dump
--

\restrict 8sKhbu38Atwo1aIxX8lz30oe19JlJJKod6UeNTCGhS5Nn7OAYeEAxYsupfFwStm

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action character varying(255) NOT NULL,
    user_id uuid,
    payload jsonb,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO hotel_user;

--
-- Name: backups; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename character varying(255) NOT NULL,
    path character varying(255) NOT NULL,
    size_bytes bigint DEFAULT '0'::bigint NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.backups OWNER TO hotel_user;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    nit character varying(30) NOT NULL,
    address character varying(255),
    phone character varying(30),
    email character varying(255),
    contact_name character varying(255),
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.companies OWNER TO hotel_user;

--
-- Name: extra_services; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.extra_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(12,2) NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.extra_services OWNER TO hotel_user;

--
-- Name: guest_companions; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.guest_companions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    document_type character varying(20),
    document_number character varying(50),
    relationship character varying(80),
    age smallint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.guest_companions OWNER TO hotel_user;

--
-- Name: guests; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    document_type character varying(20) NOT NULL,
    document_number character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(30),
    nationality character varying(80),
    birth_date date,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.guests OWNER TO hotel_user;

--
-- Name: hotels; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.hotels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    nit character varying(255),
    address character varying(255),
    phone character varying(20),
    email character varying(255),
    city character varying(255) DEFAULT 'San José del Guaviare'::character varying NOT NULL,
    country character varying(5) DEFAULT 'CO'::character varying NOT NULL,
    logo_path character varying(255),
    check_in_time time(0) without time zone DEFAULT '14:00:00'::time without time zone NOT NULL,
    check_out_time time(0) without time zone DEFAULT '12:00:00'::time without time zone NOT NULL,
    late_checkout_fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    currency character varying(5) DEFAULT 'COP'::character varying NOT NULL,
    tax_rate numeric(6,4) DEFAULT 0.19 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.hotels OWNER TO hotel_user;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO hotel_user;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: hotel_user
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO hotel_user;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hotel_user
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.model_has_permissions (
    permission_id uuid NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id uuid NOT NULL
);


ALTER TABLE public.model_has_permissions OWNER TO hotel_user;

--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.model_has_roles (
    role_id uuid NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id uuid NOT NULL
);


ALTER TABLE public.model_has_roles OWNER TO hotel_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    payload jsonb,
    is_read boolean DEFAULT false NOT NULL,
    user_id uuid,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO hotel_user;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO hotel_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stay_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(20) NOT NULL,
    payment_type character varying(20) NOT NULL,
    paid_by character varying(20) NOT NULL,
    payment_split_details jsonb,
    receipt_path character varying(255),
    receptionist_id uuid NOT NULL,
    payment_date timestamp(0) without time zone NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.payments OWNER TO hotel_user;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.permissions OWNER TO hotel_user;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO hotel_user;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: hotel_user
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO hotel_user;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hotel_user
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.role_has_permissions (
    permission_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE public.role_has_permissions OWNER TO hotel_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.roles OWNER TO hotel_user;

--
-- Name: room_transfers; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.room_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stay_id uuid NOT NULL,
    from_room_id uuid NOT NULL,
    to_room_id uuid NOT NULL,
    transferred_by uuid NOT NULL,
    reason character varying(255),
    transferred_at timestamp(0) without time zone NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.room_transfers OWNER TO hotel_user;

--
-- Name: room_types; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.room_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    max_occupancy smallint DEFAULT '2'::smallint NOT NULL,
    amenities jsonb,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.room_types OWNER TO hotel_user;

--
-- Name: rooms; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hotel_id uuid NOT NULL,
    room_type_id uuid NOT NULL,
    number character varying(20) NOT NULL,
    floor smallint,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.rooms OWNER TO hotel_user;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.settings (
    key character varying(255) NOT NULL,
    value text,
    type character varying(255) DEFAULT 'string'::character varying NOT NULL,
    "group" character varying(255) DEFAULT 'general'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.settings OWNER TO hotel_user;

--
-- Name: stay_guests; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.stay_guests (
    id uuid NOT NULL,
    stay_id uuid NOT NULL,
    guest_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.stay_guests OWNER TO hotel_user;

--
-- Name: stay_rooms; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.stay_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stay_id uuid NOT NULL,
    room_id uuid NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    price_per_night numeric(12,2) NOT NULL,
    nights smallint NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.stay_rooms OWNER TO hotel_user;

--
-- Name: stay_services; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.stay_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stay_id uuid NOT NULL,
    extra_service_id uuid NOT NULL,
    quantity smallint DEFAULT '1'::smallint NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    applied_at timestamp(0) without time zone NOT NULL,
    applied_by uuid NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.stay_services OWNER TO hotel_user;

--
-- Name: stays; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.stays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    company_id uuid,
    reservation_id uuid,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    check_in_datetime timestamp(0) without time zone NOT NULL,
    check_out_datetime timestamp(0) without time zone NOT NULL,
    actual_check_out_datetime timestamp(0) without time zone,
    late_checkout_fee numeric(12,2),
    total_amount numeric(12,2),
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_by uuid NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.stays OWNER TO hotel_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified_at timestamp(0) without time zone,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.users OWNER TO hotel_user;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.activity_logs (id, action, user_id, payload, created_at) FROM stdin;
019e7c80-9a35-71e1-8a56-eb11d8fd45fd	login_failed	\N	{"ip": "172.20.0.1", "email": "admin@hotel.com"}	2026-05-31 00:27:43
019e7c80-e0db-73ca-b75d-cf0548d8fd34	login_failed	\N	{"ip": "172.20.0.1", "email": "admin@hotelsjg.com"}	2026-05-31 00:28:01
019e7c89-512c-70b1-9b6e-8011f276e50f	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:37:14
019e7c89-a847-702b-82f8-0e440dee5375	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:37:36
019e7c89-d0fd-70aa-943a-3fee014bf275	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:37:47
019e7c8b-c88f-7219-af11-d003c3be760c	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:39:56
019e7c8b-f1eb-7147-a16b-37887dbd83f9	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:40:06
019e7c8c-e5c3-7111-8810-d40852d2022f	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:41:09
019e7c8d-084f-7098-bff2-d4d0af3466fd	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:41:18
019e7c94-4cff-7353-94df-5cb983d0993f	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:49:14
019e7c94-f5b2-727c-b28a-389a5540afd3	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:49:57
019e7c95-22d9-700f-8dec-91216a765902	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:50:09
019e7c99-965c-71f7-990b-cf133053bd3d	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:55:00
019e7c99-c688-72f5-8877-9bef0d8c1e9b	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:55:13
019e7c99-f200-72cb-b4b6-f063fdf4ed4e	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:55:24
019e7c9a-1bc0-7046-b42b-a3dab73e33ab	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:55:34
019e7c9a-5172-7075-b213-d42713f56400	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:55:48
019e7c9a-8567-73b6-b373-0d365e535c9d	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:56:02
019e7c9a-befd-727f-8467-432c986edb93	login	019e7c00-1403-7099-91d4-ed4fca297185	{"ip": "172.20.0.1"}	2026-05-31 00:56:16
019e7c9a-df05-70bd-96e0-a385a4670534	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 00:56:24
019e7ca8-5623-71a1-a823-d5d6845643f3	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 01:11:07
019e7ca8-6597-7343-ac74-f1f710e338b6	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-05-31 01:11:11
019e83bb-bfac-71b0-a35d-76293d69aef7	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 10:09:40
019e83ca-6289-702c-b0bc-2fd3a75a633f	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 10:25:39
019e83ca-9184-72d1-9d18-903f493a0192	logout	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 10:25:51
019e83d7-3e00-70c0-83d4-6cf796c58d87	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 10:39:41
019e8532-5c5b-7249-9190-ba9945ea8799	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 16:58:50
019e8570-2062-71d5-8f9a-d13ebb3eea51	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 18:06:18
019e8642-5d31-7179-9251-e3d214c9dba9	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 21:55:56
019e8672-bb21-711c-9039-439eb8d9ed23	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 22:48:46
019e8688-d806-706e-9335-34a6a77c5fdd	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-01 23:12:55
019e8900-e0a9-7195-91dc-adbb00e50afd	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-02 10:43:16
019e8a87-6812-72e5-b96d-7c46bd72d4cf	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-02 17:49:50
019e8a87-c958-7362-ae78-906712c4d520	login	019e7c00-1337-73c7-8214-7327a37ef6f5	{"ip": "172.20.0.1"}	2026-06-02 17:50:15
019e8a90-1b22-704c-a991-f8b3f8bf126c	login	019e7c00-123c-71f3-af8f-3563ae7feaed	{"ip": "127.0.0.1"}	2026-06-02 17:59:20
\.


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.backups (id, filename, path, size_bytes, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.companies (id, name, nit, address, phone, email, contact_name, notes, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: extra_services; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.extra_services (id, name, price, description, active, created_at, updated_at) FROM stdin;
019e7ca5-6489-7268-b95c-7cd1f462fec7	Desayuno	15000.00	Desayuno continental por persona	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-648f-700f-8c30-fd2265c60fb4	Almuerzo	20000.00	Almuerzo por persona	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-6493-72c3-9628-88aa2188526b	Cena	20000.00	Cena por persona	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-6496-70b7-979d-823401b2180f	Lavandería	10000.00	Servicio de lavandería por prenda	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-649a-7354-b1ef-ac25b5fd95a7	Parqueadero	8000.00	Parqueadero por día	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-649d-70a1-8f0d-716d3f692db2	Minibar	5000.00	Consumo de minibar	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-64a0-7139-a6c2-cf3281a9217d	Transporte	30000.00	Transporte aeropuerto/terminal	t	2026-05-31 01:07:54	2026-05-31 01:07:54
019e7ca5-64a3-7121-bbc0-f9bebac9440d	Servicio a cuarto	5000.00	Cargo por servicio a la habitación	t	2026-05-31 01:07:54	2026-05-31 01:07:54
\.


--
-- Data for Name: guest_companions; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.guest_companions (id, guest_id, name, document_type, document_number, relationship, age, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guests; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.guests (id, full_name, document_type, document_number, email, phone, nationality, birth_date, notes, created_at, updated_at, deleted_at) FROM stdin;
019e7c94-f713-732e-9f80-82e9075b5633	Juan Perez Test	cc	123456789	\N	3001234567	\N	\N	\N	2026-05-31 00:49:57	2026-05-31 00:49:57	\N
\.


--
-- Data for Name: hotels; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.hotels (id, name, nit, address, phone, email, city, country, logo_path, check_in_time, check_out_time, late_checkout_fee, currency, tax_rate, created_at, updated_at) FROM stdin;
019e7c00-107e-7048-8edc-c2b166a3c9ac	Hotel San José del Guaviare	900000000-0	Carrera 1 # 1-01	+57 300 000 0000	hotel@sjg.com	San José del Guaviare	CO	\N	14:00:00	12:00:00	50000.00	COP	0.1900	2026-05-30 22:07:19	2026-05-30 22:07:19
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_hotels_table	1
2	0001_01_01_000001_create_users_table	1
3	0001_01_01_000002_create_activity_logs_table	1
4	0001_01_01_000003_create_notifications_table	1
5	0001_01_01_000004_create_settings_table	1
6	0001_01_01_000005_create_backups_table	1
7	0001_01_01_000006_create_permission_tables	1
8	0001_01_01_000007_create_personal_access_tokens_table	1
9	0001_01_01_000008_create_room_types_table	1
10	0001_01_01_000009_create_rooms_table	1
11	0001_01_01_000010_create_guests_table	2
12	0001_01_01_000011_create_guest_companions_table	2
13	0001_01_01_000012_create_companies_table	2
14	0001_01_01_000013_create_stays_table	2
15	0001_01_01_000014_create_stay_rooms_table	2
16	0001_01_01_000015_create_payments_table	2
17	0001_01_01_000016_create_room_transfers_table	2
18	0001_01_01_000017_create_extra_services_table	2
19	0001_01_01_000018_fix_personal_access_tokens_uuid	3
20	0001_01_01_000019_create_stay_guests_table	4
\.


--
-- Data for Name: model_has_permissions; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.model_has_permissions (permission_id, model_type, model_id) FROM stdin;
\.


--
-- Data for Name: model_has_roles; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.model_has_roles (role_id, model_type, model_id) FROM stdin;
019e7c00-10e2-70a6-89a3-b77eba11996f	App\\Models\\User	019e7c00-123c-71f3-af8f-3563ae7feaed
019e7c00-10e9-717a-bf73-98ff1a9b88b0	App\\Models\\User	019e7c00-1337-73c7-8214-7327a37ef6f5
019e7c00-112b-7182-94e9-c93c67493c1d	App\\Models\\User	019e7c00-1403-7099-91d4-ed4fca297185
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.notifications (id, type, title, message, payload, is_read, user_id, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.payments (id, stay_id, amount, payment_method, payment_type, paid_by, payment_split_details, receipt_path, receptionist_id, payment_date, notes, created_at, updated_at) FROM stdin;
019e7c9a-c08f-72ac-b690-3ac4a5749b67	019e7c9a-8884-72b1-9058-eea7af9baaa4	100000.00	cash	deposit	guest	\N	\N	019e7c00-1403-7099-91d4-ed4fca297185	2026-05-31 00:56:17	\N	2026-05-31 00:56:17	2026-05-31 00:56:17
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.permissions (id, name, guard_name, created_at, updated_at) FROM stdin;
019e7c00-108b-722b-8a34-c65501f9e422	view_dashboard	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-1090-70f5-ac6b-fe432a3428b9	view_rooms	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-1096-728f-9b5b-7176ebf4f754	manage_rooms	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-109b-72bc-9dcd-2c34298a854f	view_reservations	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10a0-706b-8425-b8a2bd632ebb	manage_reservations	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10a6-7008-a388-eac08def77c2	check_in	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10ab-7169-8a8a-6c0d236d2db5	check_out	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10af-71ae-a233-1cf55048a0d1	view_inventory	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10b4-71cc-b5b6-408527c2ed4a	manage_inventory	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10b9-7316-bdc3-049687b10209	view_settings	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10bd-701b-ae28-6caf7b817e88	manage_settings	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10c1-7151-bafa-1006531e8778	view_activity_log	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10c7-71f9-8da9-5081597aad15	manage_users	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10cc-7236-9a53-406dc6904bba	manage_roles	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10d0-7016-a51d-90c195ed973b	trigger_backup	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10d6-70db-9c23-321ad6c5688a	restore_backup	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10dc-7044-ab4a-32f059d92097	view_reports	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
63	App\\Models\\User	019e7c00-123c-71f3-af8f-3563ae7feaed	hotel-session	dfcdd11626c3789cd1de74ffc6f109d2c588165f3f604569082edcfaa76a05ce	["*"]	2026-06-02 17:59:30	2026-06-03 01:59:20	2026-06-02 17:59:20	2026-06-02 17:59:30
62	App\\Models\\User	019e7c00-1337-73c7-8214-7327a37ef6f5	hotel-session	0f3b650f5f50085caff56b8c3c1a44427e18d474c76e64fff68d5bff15127601	["*"]	2026-06-02 18:01:53	2026-06-03 01:50:15	2026-06-02 17:50:15	2026-06-02 18:01:53
17	App\\Models\\User	019e7c00-1403-7099-91d4-ed4fca297185	hotel-session	3909c1eb71a0c60373e700d22174ebe507e33db483ec90f488591e84fb88e2c0	["*"]	2026-05-31 00:56:17	2026-05-31 08:56:16	2026-05-31 00:56:16	2026-05-31 00:56:17
\.


--
-- Data for Name: role_has_permissions; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.role_has_permissions (permission_id, role_id) FROM stdin;
019e7c00-108b-722b-8a34-c65501f9e422	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-1090-70f5-ac6b-fe432a3428b9	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-1096-728f-9b5b-7176ebf4f754	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-109b-72bc-9dcd-2c34298a854f	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10a0-706b-8425-b8a2bd632ebb	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10a6-7008-a388-eac08def77c2	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10ab-7169-8a8a-6c0d236d2db5	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10af-71ae-a233-1cf55048a0d1	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10b4-71cc-b5b6-408527c2ed4a	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10b9-7316-bdc3-049687b10209	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10bd-701b-ae28-6caf7b817e88	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10c1-7151-bafa-1006531e8778	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10c7-71f9-8da9-5081597aad15	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10d0-7016-a51d-90c195ed973b	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10d6-70db-9c23-321ad6c5688a	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-10dc-7044-ab4a-32f059d92097	019e7c00-10e9-717a-bf73-98ff1a9b88b0
019e7c00-108b-722b-8a34-c65501f9e422	019e7c00-112b-7182-94e9-c93c67493c1d
019e7c00-1090-70f5-ac6b-fe432a3428b9	019e7c00-112b-7182-94e9-c93c67493c1d
019e7c00-10a0-706b-8425-b8a2bd632ebb	019e7c00-112b-7182-94e9-c93c67493c1d
019e7c00-10a6-7008-a388-eac08def77c2	019e7c00-112b-7182-94e9-c93c67493c1d
019e7c00-10ab-7169-8a8a-6c0d236d2db5	019e7c00-112b-7182-94e9-c93c67493c1d
019e7c00-10af-71ae-a233-1cf55048a0d1	019e7c00-112b-7182-94e9-c93c67493c1d
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.roles (id, name, guard_name, created_at, updated_at) FROM stdin;
019e7c00-10e2-70a6-89a3-b77eba11996f	superadmin	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-10e9-717a-bf73-98ff1a9b88b0	admin	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-112b-7182-94e9-c93c67493c1d	receptionist	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-1162-7323-b025-2e2002d123c8	housekeeping	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-1168-71e5-8834-2be463d76877	maintenance	sanctum	2026-05-30 22:07:19	2026-05-30 22:07:19
\.


--
-- Data for Name: room_transfers; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.room_transfers (id, stay_id, from_room_id, to_room_id, transferred_by, reason, transferred_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: room_types; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.room_types (id, name, description, base_price, max_occupancy, amenities, created_at, updated_at) FROM stdin;
019e7c00-1438-73a1-a8ae-fa8de318bcd4	Sencilla	Habitación con una cama individual	80000.00	1	["wifi", "tv", "baño_privado"]	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-143c-70e9-89b2-1b0f3056cb77	Doble	Habitación con dos camas individuales	120000.00	2	["wifi", "tv", "baño_privado", "aire_acondicionado"]	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1441-71e4-a325-8e5fc9499741	Matrimonial	Habitación con cama doble	130000.00	2	["wifi", "tv", "baño_privado", "aire_acondicionado"]	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1445-70f7-8dd5-d3b03ca6dec3	Triple	Habitación con tres camas	160000.00	3	["wifi", "tv", "baño_privado", "aire_acondicionado"]	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1449-70f6-8d5e-8cca45fdeca7	Suite	Suite ejecutiva con sala de estar	220000.00	2	["wifi", "tv", "baño_privado", "aire_acondicionado", "minibar", "sala"]	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-144e-73de-bd46-fe2f821c803a	Casa	Casa independiente con múltiples habitaciones	350000.00	8	["wifi", "tv", "cocina", "sala", "patio", "parqueadero"]	2026-05-30 22:07:20	2026-05-30 22:07:20
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.rooms (id, hotel_id, room_type_id, number, floor, status, notes, is_active, created_at, updated_at) FROM stdin;
019e7c00-1462-7394-9a2a-c9421b29c440	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-143c-70e9-89b2-1b0f3056cb77	103	1	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1465-73de-bbbf-ef50a12da4dd	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-143c-70e9-89b2-1b0f3056cb77	104	1	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-146a-714d-81c1-148beaa9d675	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1441-71e4-a325-8e5fc9499741	105	1	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-146e-71bd-8a64-cc0decf83eb4	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1445-70f7-8dd5-d3b03ca6dec3	106	1	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1472-720b-a75e-a3954cb519f3	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1445-70f7-8dd5-d3b03ca6dec3	107	1	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1475-7065-9098-a1bd18d15485	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1438-73a1-a8ae-fa8de318bcd4	201	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1478-732c-bf8e-cc566dbeea2a	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1438-73a1-a8ae-fa8de318bcd4	202	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-147c-708a-a234-03b2bc258bcf	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-143c-70e9-89b2-1b0f3056cb77	203	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1481-724e-b206-17d58824847b	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1441-71e4-a325-8e5fc9499741	204	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1484-708e-9589-5ac3cfedf8d4	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1445-70f7-8dd5-d3b03ca6dec3	205	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1487-71a6-9034-58c7ea0c46e7	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1449-70f6-8d5e-8cca45fdeca7	206	2	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-148b-727c-8597-f91880025a54	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-144e-73de-bd46-fe2f821c803a	Casa	\N	available	\N	t	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1457-7362-ae88-56ec82cb33ff	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1438-73a1-a8ae-fa8de318bcd4	101	1	cleaning	\N	t	2026-05-30 22:07:20	2026-05-31 00:50:09
019e7c00-145e-73e1-8286-cbc0244d8e4b	019e7c00-107e-7048-8edc-c2b166a3c9ac	019e7c00-1438-73a1-a8ae-fa8de318bcd4	102	1	occupied	\N	t	2026-05-30 22:07:20	2026-05-31 00:56:02
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.settings (key, value, type, "group", created_at, updated_at) FROM stdin;
hotel.iva_enabled	true	boolean	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.iva_rate	19	integer	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.check_out_time	13:00	string	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.check_in_time	14:00	string	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.currency	COP	string	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.country	Colombia	string	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
hotel.late_checkout_fee	50000	integer	hotel	2026-05-30 22:07:20	2026-05-30 22:07:20
system.date_format	DD/MM/YYYY	string	system	2026-05-30 22:07:20	2026-05-30 22:07:20
system.time_format	HH:mm	string	system	2026-05-30 22:07:20	2026-05-30 22:07:20
backup.auto_backup	true	boolean	backup	2026-05-30 22:07:20	2026-05-30 22:07:20
backup.retention_days	30	integer	backup	2026-05-30 22:07:20	2026-05-30 22:07:20
\.


--
-- Data for Name: stay_guests; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.stay_guests (id, stay_id, guest_id, is_primary, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stay_rooms; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.stay_rooms (id, stay_id, room_id, check_in_date, check_out_date, price_per_night, nights, subtotal, is_active, created_at, updated_at) FROM stdin;
019e7c94-fa74-70cd-ad80-f144d8bddc2d	019e7c94-fa6f-70e7-8b48-b98a2f81526d	019e7c00-1457-7362-ae88-56ec82cb33ff	2026-05-31	2026-06-02	150000.00	2	300000.00	t	2026-05-31 00:49:58	2026-05-31 00:49:58
019e7c9a-888a-7173-aa38-40b728eab7a1	019e7c9a-8884-72b1-9058-eea7af9baaa4	019e7c00-145e-73e1-8286-cbc0244d8e4b	2026-05-31	2026-06-03	200000.00	3	600000.00	t	2026-05-31 00:56:02	2026-05-31 00:56:02
\.


--
-- Data for Name: stay_services; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.stay_services (id, stay_id, extra_service_id, quantity, unit_price, total, applied_at, applied_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stays; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.stays (id, guest_id, company_id, reservation_id, status, check_in_datetime, check_out_datetime, actual_check_out_datetime, late_checkout_fee, total_amount, paid_amount, created_by, notes, created_at, updated_at) FROM stdin;
019e7c94-fa6f-70e7-8b48-b98a2f81526d	019e7c94-f713-732e-9f80-82e9075b5633	\N	\N	checked_out	2026-05-31 08:00:00	2026-06-02 12:00:00	2026-05-31 00:50:09	\N	300000.00	0.00	019e7c00-1403-7099-91d4-ed4fca297185	\N	2026-05-31 00:49:58	2026-05-31 00:50:09
019e7c9a-8884-72b1-9058-eea7af9baaa4	019e7c94-f713-732e-9f80-82e9075b5633	\N	\N	active	2026-05-31 09:00:00	2026-06-03 12:00:00	\N	\N	600000.00	100000.00	019e7c00-1403-7099-91d4-ed4fca297185	\N	2026-05-31 00:56:02	2026-05-31 00:56:17
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.users (id, name, email, password, is_active, email_verified_at, remember_token, created_at, updated_at) FROM stdin;
019e7c00-123c-71f3-af8f-3563ae7feaed	Super Administrador	superadmin@hotelsjg.com	$2y$12$JRInVJkqPeIuRbV2q9nPxu8JWmeMgnKGNIDEXxipAPnjr7W/6ejdu	t	\N	\N	2026-05-30 22:07:19	2026-05-30 22:07:19
019e7c00-1337-73c7-8214-7327a37ef6f5	Administrador	admin@hotelsjg.com	$2y$12$lrWYLbCF3slPi29EDzVau.WYC05Cd81m7bRvTzYNmZpK29ssp1jeu	t	\N	\N	2026-05-30 22:07:20	2026-05-30 22:07:20
019e7c00-1403-7099-91d4-ed4fca297185	Recepcionista	recepcion@hotelsjg.com	$2y$12$O2ZvlBku3DqGMdfPAhahZukBNWDaLuCnp/ozgHmNw6nhzZWOHri6K	t	\N	\N	2026-05-30 22:07:20	2026-05-30 22:07:20
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hotel_user
--

SELECT pg_catalog.setval('public.migrations_id_seq', 20, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hotel_user
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 63, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: companies companies_nit_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_nit_unique UNIQUE (nit);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: extra_services extra_services_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.extra_services
    ADD CONSTRAINT extra_services_pkey PRIMARY KEY (id);


--
-- Name: guest_companions guest_companions_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guest_companions
    ADD CONSTRAINT guest_companions_pkey PRIMARY KEY (id);


--
-- Name: guests guests_document_number_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_document_number_unique UNIQUE (document_number);


--
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: room_transfers room_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_hotel_id_number_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_hotel_id_number_unique UNIQUE (hotel_id, number);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: stay_guests stay_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_guests
    ADD CONSTRAINT stay_guests_pkey PRIMARY KEY (id);


--
-- Name: stay_guests stay_guests_stay_id_guest_id_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_guests
    ADD CONSTRAINT stay_guests_stay_id_guest_id_unique UNIQUE (stay_id, guest_id);


--
-- Name: stay_rooms stay_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_rooms
    ADD CONSTRAINT stay_rooms_pkey PRIMARY KEY (id);


--
-- Name: stay_services stay_services_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_services
    ADD CONSTRAINT stay_services_pkey PRIMARY KEY (id);


--
-- Name: stays stays_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stays
    ADD CONSTRAINT stays_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_action_created_at_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX activity_logs_action_created_at_index ON public.activity_logs USING btree (action, created_at);


--
-- Name: activity_logs_user_id_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX activity_logs_user_id_index ON public.activity_logs USING btree (user_id);


--
-- Name: backups_created_at_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX backups_created_at_index ON public.backups USING btree (created_at);


--
-- Name: guests_document_number_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX guests_document_number_index ON public.guests USING btree (document_number);


--
-- Name: guests_full_name_trgm; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX guests_full_name_trgm ON public.guests USING gin (full_name public.gin_trgm_ops);


--
-- Name: guests_phone_trgm; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX guests_phone_trgm ON public.guests USING gin (phone public.gin_trgm_ops);


--
-- Name: model_has_perms_model_id_model_type_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX model_has_perms_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: notifications_user_id_is_read_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX notifications_user_id_is_read_index ON public.notifications USING btree (user_id, is_read);


--
-- Name: payments_stay_id_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX payments_stay_id_index ON public.payments USING btree (stay_id);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: rooms_status_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX rooms_status_index ON public.rooms USING btree (status);


--
-- Name: stays_check_in_datetime_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX stays_check_in_datetime_index ON public.stays USING btree (check_in_datetime);


--
-- Name: stays_status_index; Type: INDEX; Schema: public; Owner: hotel_user
--

CREATE INDEX stays_status_index ON public.stays USING btree (status);


--
-- Name: activity_logs activity_logs_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: backups backups_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: guest_companions guest_companions_guest_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guest_companions
    ADD CONSTRAINT guest_companions_guest_id_foreign FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_receptionist_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_receptionist_id_foreign FOREIGN KEY (receptionist_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payments payments_stay_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_stay_id_foreign FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: room_transfers room_transfers_from_room_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_from_room_id_foreign FOREIGN KEY (from_room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT;


--
-- Name: room_transfers room_transfers_stay_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_stay_id_foreign FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: room_transfers room_transfers_to_room_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_to_room_id_foreign FOREIGN KEY (to_room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT;


--
-- Name: room_transfers room_transfers_transferred_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.room_transfers
    ADD CONSTRAINT room_transfers_transferred_by_foreign FOREIGN KEY (transferred_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: rooms rooms_hotel_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_hotel_id_foreign FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE CASCADE;


--
-- Name: rooms rooms_room_type_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_type_id_foreign FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE CASCADE;


--
-- Name: stay_guests stay_guests_guest_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_guests
    ADD CONSTRAINT stay_guests_guest_id_foreign FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: stay_guests stay_guests_stay_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_guests
    ADD CONSTRAINT stay_guests_stay_id_foreign FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: stay_rooms stay_rooms_room_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_rooms
    ADD CONSTRAINT stay_rooms_room_id_foreign FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE RESTRICT;


--
-- Name: stay_rooms stay_rooms_stay_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_rooms
    ADD CONSTRAINT stay_rooms_stay_id_foreign FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: stay_services stay_services_applied_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_services
    ADD CONSTRAINT stay_services_applied_by_foreign FOREIGN KEY (applied_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: stay_services stay_services_extra_service_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_services
    ADD CONSTRAINT stay_services_extra_service_id_foreign FOREIGN KEY (extra_service_id) REFERENCES public.extra_services(id) ON DELETE RESTRICT;


--
-- Name: stay_services stay_services_stay_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stay_services
    ADD CONSTRAINT stay_services_stay_id_foreign FOREIGN KEY (stay_id) REFERENCES public.stays(id) ON DELETE CASCADE;


--
-- Name: stays stays_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stays
    ADD CONSTRAINT stays_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: stays stays_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stays
    ADD CONSTRAINT stays_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: stays stays_guest_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.stays
    ADD CONSTRAINT stays_guest_id_foreign FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 8sKhbu38Atwo1aIxX8lz30oe19JlJJKod6UeNTCGhS5Nn7OAYeEAxYsupfFwStm

