<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { spiders } = data;
</script>

<Header />
<div class="Page">
	<header>
		<h1>Explore our cluster of spiders.</h1>
	</header>
	{#each spiders as spider}
		{#if spider.base_scrape}
			<Scrape
				id={spider.id}
				scrape={spider.base_scrape}
				scrapeAttemptsCount={spider.attempts.length}
				spider={true}
			/>
		{/if}
	{/each}
</div>

<style>
header {
	margin: 0 auto;
	max-width: 1000px;
	width: 100%;
}
</style>