<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import LeftArrow from '../svg/left-arrow.svg';
	import routerHistory from '../utils/router-history';

	const { navigate } = routerHistory;

	export let route = -1;
</script>

<button
	class="components-button components-button--back is-link close"
	on:click={() => navigate( route )}
>
	<LeftArrow />
	{__( 'Go back', 'jetpack-boost' )}
</button>
