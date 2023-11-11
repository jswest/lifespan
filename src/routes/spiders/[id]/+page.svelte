<script>
	import Header from '$lib/components/Header.svelte';
	import Scrape from '$lib/components/Scrape.svelte';
	export let data;
	const { attempts, base } = data;
</script>

<Header />
<div class="Page">
	<header>
		<h1>Spider from base: <span class="url">{base.url_requested}</span></h1>
	</header>
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
	header h1 {
		font-size: calc(var(--unit) * 2);
		font-style: italic;
		font-weight: 100;
		letter-spacing: calc(var(--unit) * 2 * 0.1);
		margin-left: var(--unit);
		text-transform: uppercase;
	}
	header h1 .url {
		font-size: var(--unit);
		font-style: normal;
		font-family: var(--font-sans);
		font-weight: 800;
		letter-spacing: calc(var(--unit) * 0.1);
	}

</style>