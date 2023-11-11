<script>
	import Header from '$lib/components/Header.svelte';
	import KeyValue from '$lib/components/KeyValue.svelte';
	export let data;
	const { scrape } = data;
	const asset = scrape?.assets.find((d) => d.channel_name === 's3');
</script>

<Header />
<div class="Page">
	<h1>{scrape.url_scraped}</h1>
	<KeyValue key="id" value={scrape.id} />
	<KeyValue key="scraped_at" value={scrape.scraped_at} />
	<KeyValue key="url_requested" value={scrape.attempt.url_requested} />
	<div class="screenshot">
		{#if asset}
			<img src="/images/?key={asset.screenshot_location}" />
		{/if}
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