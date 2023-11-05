<script>
	import KeyValue from '$lib/components/KeyValue.svelte';
	export let scrape;
	export let spider;

	const keys = [
		'id',
		!spider ? 'scraped_at' : false,
		spider ? 'scrapes_count' : false,
		'url_requested',
		'url_scraped',
	].filter((d) => d);

</script>

<div class="Scrape">
	<div class="bg">
		<a href="/{spider ? 'spiders' : 'scrapes'}/{scrape.id}">
			<img src="/images/?key={scrape.thumbnail_location}" />
		</a>
	</div>
	<div class="guts">
		{#each keys as key}
			<KeyValue key={key} value={scrape[key]} />
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
	box-sizing: border-box;
	left: 0;
	padding: calc(var(--unit) * 0.5);
	position: relative;
	top: 200px;
	width: 100%;
	z-index: 20;
}
</style>