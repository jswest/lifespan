<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { spiders } = data;

	function passToScrape(spider) {
		return {
			id: spider.id,
			git_commit_hash: spider.git_commit_hash,
			requested_at: spider.requested_at,
			scraped_at: spider.scraped_at,
			url_requested: spider.url_requested,
			url_scraped: spider.url_scraped,
			user_agent: spider.user_agent,
			viewport_height: spider.viewport_height,
			viewport_width: spider.viewport_width,
			wait: spider.wait,
			html_location: spider.html_location,
			metadata_location: spider.metadata_location,
			root_location: spider.root_location,
			screenshot_location: spider.screenshot_location,
			thumbnail_location: spider.thumbnail_location,
			scrapes_count: spider.scrapes_count,
		}
	}
</script>

<Header />
<div class="Page">
	<header>
		<h1>Explore our cluster of spiders.</h1>
	</header>
	{#each spiders as spider}
		<Scrape scrape={passToScrape(spider)} spider={true} />
	{/each}
</div>

<style>
header {
	margin: 0 auto;
	max-width: 1000px;
	width: 100%;
}
</style>