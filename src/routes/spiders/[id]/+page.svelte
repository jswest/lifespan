<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { attempts } = data;
</script>

<Header />
<div class="Page">
	{#each attempts as attempt}
		<Scrape
			id="{attempt.id}"
			attempt="{attempt}"
			scrape="{attempt?.scrape}"
			spider="{false}"
		/>
	{/each}
</div>

<style>

</style>