<script>
	import KeyValue from '$lib/components/KeyValue.svelte';
	export let id;
	export let attempt;
	export let scrape;
	export let scrapeAttemptsCount;
	export let spider;

	const asset = scrape?.assets?.find((d) => d.channel_name === 's3');

	const pairs = {
		id: id,
		scraped_at: scrape.scraped_at,
		url_scraped: scrape.url_scraped
	};
	if (spider) {
		pairs.url_requested = scrape.attempt.url_requested;
		pairs.scrape_attempts_count = scrapeAttemptsCount; 
	} else {
		pairs.url_requested = attempt.url_requested;
	}
	if (!scrape.id) {
		pairs.errors = attempt.errors;
	}

</script>

<div class="Scrape {!scrape.id ? 'failed' : ''}">
	<div class="bg">
		{#if scrape.id}
			<a href="/{spider ? 'spiders' : 'scrapes'}/{spider ? id : scrape.id}">
				{#if asset}
					<img src="/images/?key={asset.thumbnail_location}" />
				{/if}
			</a>
		{/if}
	</div>
	<div class="guts">
		{#each Object.entries(pairs) as [key, value]}
			<KeyValue key={key} value={value} />
		{/each}
	</div>
</div>

<style>
.Scrape {
	background-color: white;
	border: 1px solid black;
	float: left;
	height: 320px;
	margin: var(--unit);
	overflow: scroll;
	position: relative;
	width: 320px;
}
.Scrape.failed {
	background-color: #ffdddd;
	border: 1px solid red;
}
.bg {
	border-bottom: 1px solid black;
	height: 200px;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
	z-index: 10;
}
.bg img {
	height: 100%;
	width: 100%;
}
.guts {
	background-color: white;
	border-top: 1px solid black;
	box-sizing: border-box;
	left: 0;
	min-height: calc(320px - 200px);
	padding: calc(var(--unit) * 0.5);
	position: relative;
	top: 200px;
	width: 100%;
	z-index: 20;
}
</style>