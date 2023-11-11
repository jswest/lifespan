<script>
	export let key;
	export let value;

	function prettify(v) {
		if (value instanceof Date) {
			const intermediate = value.toLocaleString('en');
			const parts = intermediate.split(' ');
			const last = parts.length - 1;
			return parts.slice(0, last).join(' ') + ' ' + `<span class="small">${parts[last].toLowerCase()}</span>`;
		} else if (typeof value === 'number') {
			return value.toLocaleString('en');
		} else {
			return value;
		}
	}
</script>

<div class="KeyValue">
	<p><span class="key">{key.split('_').join(' ')}</span>: {@html prettify(value)}</p>
</div>

<style>
	p {
		font-size: calc(var(--unit) * 0.75);
		line-height: var(--unit);
	}
	.key {
		border-bottom: 1px dotted var(--color-secondary);
		color: var(--color-secondary);
		font-family: "Helvetica Neue";
		font-size: calc(var(--unit) * 0.5);
		letter-spacing: calc(var(--unit) * 0.5 * 0.1);
		text-transform: uppercase;
	}
</style>