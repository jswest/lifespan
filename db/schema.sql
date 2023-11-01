CREATE TABLE public.scrape_metas (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	git_commit_hash TEXT,
	requested_at TIMESTAMP,
	scraped_at TIMESTAMP,
	url_requested TEXT,
	url_scraped TEXT,
	user_agent TEXT,
	viewport_height INTEGER,
	viewport_width INTEGER,
	wait INTEGER
);

CREATE TABLE public.scrape_results (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	scrape_meta_id INTEGER,
	channel_name TEXT,
	html_location TEXT,
	image_location TEXT,
	metadata_location TEXT,
	root_location TEXT
);