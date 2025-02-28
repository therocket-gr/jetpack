<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ApiError } from '../api/api-error';
	import NoticeIcon from '../svg/notice-outline.svg';
	import actionLinkTemplateVar from '../utils/action-link-template-var';
	import { TemplateVars } from '../utils/copy-dom-template';
	import { standardizeError } from '../utils/standardize-error';
	import supportLinkTemplateVar from '../utils/support-link-template-var';
	import TemplatedString from './TemplatedString.svelte';

	/**
	 * Title to display above the error message.
	 */
	export let title: string;

	/**
	 * Error being displayed. Automatically populates
	 * description (and if appropriate data) sections.
	 *
	 * Note: Description can be overridden by the default slot, if one is provided.
	 */
	export let error: Error | string = new Error( title );

	/**
	 * Optional raw string data to include with error. Automatically pulled out of ApiErrors.
	 */
	export let data = '';

	/**
	 * Optional suggestion to include after the error message.
	 */
	export let suggestion = '';

	/**
	 * Optional template variables to substitute for tags in the error suggestions.
	 * Note: Unless you supply a custom description slot and template it yourself,
	 * these will not apply to the main message / description, as it may be unsafe to parse as HTML.
	 * Note: the following template vars are automatically included in all errors:
	 * - <support>: a link to support.
	 * - <action name="">: A link to dispatch the named action.
	 */
	export let vars: TemplateVars = {};

	// Figure out an appropriate description based on error object or message.
	const description = standardizeError( error ).message;

	// Pull data out of ApiError if no data fed in.
	if ( ! data && error instanceof ApiError ) {
		data = error.getDisplayBody();
	}

	// Prepare an event dispatcher - which can dispatch actions when <action> links clicked.
	// Dispatch as both the action by name, and as 'action' with a name attached.
	const dispatch = createEventDispatcher();
	function dispatchAction( name ) {
		dispatch( name );
		dispatch( 'action', name );
	}

	// Prepare template variables available to all errors. i.e.: <support> and <action>
	const allVars = {
		...supportLinkTemplateVar(),
		...actionLinkTemplateVar( dispatchAction, 'action' ),
		...vars,
	};
</script>

<div class="jb-error">
	<NoticeIcon class="icon" />

	<div class="jb-error__main-content">
		<div class="jb-error__description">
			{title}
		</div>

		<div class="jb-error__message">
			<slot>
				<p>
					{description}
				</p>
			</slot>

			{#if data}
				<pre class="data">{ data }</pre>
			{/if}

			{#if suggestion}
				<p class="suggestion">
					<TemplatedString template={suggestion} vars={allVars} />
				</p>
			{/if}
		</div>
	</div>

	<div class="jb-error__main-action">
		<slot name="actionButton" />
	</div>
</div>
