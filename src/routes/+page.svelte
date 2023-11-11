<script>
	import Header from "$lib/components/Header.svelte";
	import Scrape from "$lib/components/Scrape.svelte";

	export let data;
	const { scrapesCount, spidersCount } = data;
</script>

<Header />
<div class="Page">
	<h1>Lifespan of a Site</h1>
	<p>
		Rot will take the web as surely as it will take our bodies; it's just that
		we have fewer illusions about the latter.
	</p>
	<p>
		There are {scrapesCount} <a href="/scrapes">scrapes</a> in our database from {spidersCount}
		<a href="/spiders">spiders</a>.
	</p>
	<p>
		For questions about this project, reach out to
		<a href="http://beebe-west.com/john">John West</a> (john@beebe-west.com)
	</p>
</div>

<style>
	.Page {
		box-sizing: border-box;
		margin: 0 auto;
		max-width: 1000px;
		padding: calc(var(--unit) * 3) var(--unit) var(--unit) var(--unit);
		width: 100%;
	}
	h1 {
		font-size: calc(var(--unit) * 4);
		font-style: italic;
		font-weight: 100;
		letter-spacing: calc(var(--unit) * 4 * 0.1);
		text-transform: uppercase;
	}
	p {
		font-size: var(--unit);
		line-height: 1.5;
	}
</style>
