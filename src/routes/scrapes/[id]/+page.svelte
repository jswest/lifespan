<script>
	import Header from '$lib/components/Header.svelte';
	import KeyValue from '$lib/components/KeyValue.svelte';
	export let data;
	const { scrape } = data;
</script>

<Header />
<div class="Page">
	<h1>{scrape.url_scraped}</h1>
	<KeyValue key="id" value={scrape.id} />
	<KeyValue key="scraped_at" value={scrape.scraped_at} />
	<KeyValue key="url_requested" value={scrape.url_requested} />
	<div class="screenshot">
		<img src="/images/?key={scrape.screenshot_location}" />
	</div>
</div>

<style>
	.Page {
		margin: 0 auto;
		max-width: 1000px;
		width: 100%;
	}
	.screenshot {
		margin-top: var(--unit);
	}
	.screenshot img {
		width: 100%;
	}
</style>