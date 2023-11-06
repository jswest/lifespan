<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { scrapes } = data;
</script>

<Header />
<div class="Page">
	{#each scrapes as scrape}
		<Scrape scrape={scrape} />
	{/each}
</div>

<style>

</style>