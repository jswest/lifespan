DROP TABLE IF EXISTS public.scrapes;
DROP TABLE IF EXISTS public.scrape_assets;
DROP TABLE IF EXISTS public.scrape_attempts;
DROP TABLE IF EXISTS public.spiders;
DROP TABLE IF EXISTS public.scrapes_spiders;
DROP TABLE IF EXISTS public.tags;

CREATE TABLE public.scrapes (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	scrape_attempt_id INTEGER,
	scraped_at TIMESTAMP,
	url_scraped TEXT
);

CREATE TABLE public.scrape_assets (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	scrape_id INTEGER,
	channel_name TEXT,
	html_location TEXT,
	metadata_location TEXT,
	root_location TEXT,
	screenshot_location TEXT,
	thumbnail_location TEXT
);

CREATE TABLE public.scrape_attempts (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	attempted_at TIMESTAMP,
	errors TEXT,
	git_commit_hash TEXT,
	url_requested TEXT,
	user_agent TEXT,
	viewport_height INTEGER,
	viewport_width INTEGER,
	wait INTEGER
);

CREATE TABLE public.spiders (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	base_scrape_id INTEGER,
	base_url TEXT,
	delay INTEGER,
	ideal_length INTEGER,
	is_local_only BOOLEAN,
	level INTEGER
);

CREATE TABLE public.scrapes_spiders (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	scrape_id INTEGER,
	spider_id INTEGER
);

CREATE TABLE public.tags (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	scrape_id INTEGER,
	name TEXT,
	value BOOLEAN
);