<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { attempts, base } = data;
</script>

<Header />
<div class="Page">
	<Scrape
		id={base.id}
		attempt={base}
		big={true}
		scrape={base.scrape}
		spider={false}
	/>
	{#each attempts as attempt}
		<Scrape
			id={attempt.id}
			attempt={attempt}
			big={false}
			scrape={attempt?.scrape}
			spider={false}
		/>
	{/each}
</div>

<style>

</style>