import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	URLInput,
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import {
	BaseControl,
	ExternalLink,
	Flex,
	Icon,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { filter, get, map } from 'lodash';
import InspectorHint from '../../shared/components/inspector-hint';
import { JetpackLogo, MailIcon, NewsletterIcon } from '../../shared/icons';
import CRMIntegrationSettings from './components/jetpack-crm-integration/jetpack-crm-integration-settings';
import JetpackEmailConnectionSettings from './components/jetpack-email-connection-settings';
import JetpackFormSettingsDropdown from './components/jetpack-form-settings-dropdown';
import JetpackManageResponsesSettings from './components/jetpack-manage-responses-settings';
import NewsletterIntegrationSettings from './components/jetpack-newsletter-integration-settings';
import defaultVariations from './variations';

const ALLOWED_BLOCKS = [
	'core/audio',
	'core/heading',
	'core/image',
	'core/list',
	'core/paragraph',
	'core/separator',
	'core/spacer',
	'core/subhead',
	'core/video',
];

const RESPONSES_PATH = '/wp-admin/edit.php?post_type=feedback';
const CUSTOMIZING_FORMS_URL = 'https://jetpack.com/support/jetpack-blocks/contact-form/';

export function JetpackContactFormEdit( {
	attributes,
	setAttributes,
	siteTitle,
	postTitle,
	postAuthorEmail,
	hasInnerBlocks,
	replaceInnerBlocks,
	selectBlock,
	clientId,
	instanceId,
	className,
	blockType,
	variations,
	defaultVariation,
	canUserInstallPlugins,
} ) {
	const {
		to,
		subject,
		customThankyou,
		customThankyouHeading,
		customThankyouMessage,
		customThankyouRedirect,
		jetpackCRM,
		formTitle,
	} = attributes;

	const formClassnames = classnames( className, 'jetpack-contact-form', {
		'is-placeholder': ! hasInnerBlocks && registerBlockVariation,
	} );

	const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
		const blocks = map( innerBlocksTemplate, ( [ name, attr, innerBlocks = [] ] ) =>
			createBlock( name, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
		);

		return blocks;
	};

	const setVariation = variation => {
		if ( variation.attributes ) {
			setAttributes( variation.attributes );
		}

		if ( variation.innerBlocks ) {
			replaceInnerBlocks( clientId, createBlocksFromInnerBlocksTemplate( variation.innerBlocks ) );
		}

		selectBlock( clientId );
	};

	useEffect( () => {
		// Populate default variation on older versions of WP or GB that don't support variations.
		if ( ! hasInnerBlocks && ! registerBlockVariation ) {
			setVariation( defaultVariations[ 0 ] );
		}
	} );

	useEffect( () => {
		if ( to === undefined && postAuthorEmail ) {
			setAttributes( { to: postAuthorEmail } );
		}

		if ( subject === undefined && siteTitle !== undefined && postTitle !== undefined ) {
			const emailSubject = '[' + siteTitle + '] ' + postTitle;
			setAttributes( { subject: emailSubject } );
		}
	}, [ to, postAuthorEmail, subject, siteTitle, postTitle, setAttributes ] );

	const renderSubmissionSettings = () => {
		return (
			<>
				<InspectorHint>
					{ __( 'Customize the view after form submission:', 'jetpack' ) }
				</InspectorHint>
				<SelectControl
					label={ __( 'On Submission', 'jetpack' ) }
					value={ customThankyou }
					options={ [
						{ label: __( 'Show a summary of submitted fields', 'jetpack' ), value: '' },
						{ label: __( 'Show a custom text message', 'jetpack' ), value: 'message' },
						{ label: __( 'Redirect to another webpage', 'jetpack' ), value: 'redirect' },
					] }
					onChange={ newMessage => setAttributes( { customThankyou: newMessage } ) }
				/>

				{ 'redirect' !== customThankyou && (
					<TextControl
						label={ __( 'Message Heading', 'jetpack' ) }
						value={ customThankyouHeading }
						placeholder={ __( 'Message Sent', 'jetpack' ) }
						onChange={ newHeading => setAttributes( { customThankyouHeading: newHeading } ) }
					/>
				) }

				{ 'message' === customThankyou && (
					<TextareaControl
						label={ __( 'Message Text', 'jetpack' ) }
						value={ customThankyouMessage }
						placeholder={ __( 'Thank you for your submission!', 'jetpack' ) }
						onChange={ newMessage => setAttributes( { customThankyouMessage: newMessage } ) }
					/>
				) }

				{ 'redirect' === customThankyou && (
					<BaseControl
						label={ __( 'Redirect Address', 'jetpack' ) }
						id={ `contact-form-${ instanceId }-thankyou-url` }
					>
						<URLInput
							id={ `contact-form-${ instanceId }-thankyou-url` }
							value={ customThankyouRedirect }
							className="jetpack-contact-form__thankyou-redirect-url"
							onChange={ newURL => setAttributes( { customThankyouRedirect: newURL } ) }
						/>
					</BaseControl>
				) }
			</>
		);
	};

	const renderVariationPicker = () => {
		return (
			<div className={ formClassnames }>
				<BlockVariationPicker
					icon={ get( blockType, [ 'icon', 'src' ] ) }
					label={ get( blockType, [ 'title' ] ) }
					instructions={ __(
						'Start building a form by selecting one of these form templates, or search in the patterns library for more forms:',
						'jetpack'
					) }
					variations={ filter( variations, v => ! v.hiddenFromPicker ) }
					onSelect={ ( nextVariation = defaultVariation ) => {
						setVariation( nextVariation );
					} }
				/>
				<Flex>
					<ExternalLink className="form-placeholder__external-link" href={ CUSTOMIZING_FORMS_URL }>
						{ __( 'Learn more about customizing forms.', 'jetpack' ) }
					</ExternalLink>
					<ExternalLink className="form-placeholder__external-link" href={ RESPONSES_PATH }>
						{ __( 'View and export your form responses here.', 'jetpack' ) }
					</ExternalLink>
				</Flex>
			</div>
		);
	};

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return renderVariationPicker();
	}

	const formSettingsSections = [
		{
			title: __( 'Email Connection', 'jetpack' ),
			icon: <Icon icon={ MailIcon } />,
			// eslint-disable-next-line no-shadow
			content: ( { attributes, setAttributes } ) => (
				<JetpackEmailConnectionSettings
					emailAddress={ attributes.to }
					emailSubject={ attributes.subject }
					instanceId={ instanceId }
					postAuthorEmail={ postAuthorEmail }
					setAttributes={ setAttributes }
				/>
			),
		},
	];

	if ( ! isSimpleSite() ) {
		formSettingsSections.push( {
			title: __( 'Newsletter Integration', 'jetpack' ),
			icon: <Icon icon={ NewsletterIcon } />,
			content: () => <NewsletterIntegrationSettings />,
		} );

		if ( canUserInstallPlugins ) {
			formSettingsSections.push( {
				title: 'Jetpack CRM',
				icon: <JetpackLogo border={ 2 } />,
				// eslint-disable-next-line no-shadow
				content: ( { attributes, setAttributes } ) => (
					<CRMIntegrationSettings
						jetpackCRM={ attributes.jetpackCRM }
						setAttributes={ setAttributes }
					/>
				),
			} );
		}
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<JetpackFormSettingsDropdown
								attributes={ attributes }
								setAttributes={ setAttributes }
								settings={ formSettingsSections }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack' ) }>
					<JetpackManageResponsesSettings formTitle={ formTitle } setAttributes={ setAttributes } />
				</PanelBody>
				<PanelBody title={ __( 'Submission Settings', 'jetpack' ) }>
					{ renderSubmissionSettings() }
				</PanelBody>
				<PanelBody title={ __( 'Email Connection', 'jetpack' ) }>
					<JetpackEmailConnectionSettings
						emailAddress={ to }
						emailSubject={ subject }
						instanceId={ instanceId }
						postAuthorEmail={ postAuthorEmail }
						setAttributes={ setAttributes }
					/>
				</PanelBody>
				{ ! isSimpleSite() && (
					<Fragment>
						{ canUserInstallPlugins && (
							<PanelBody title={ __( 'CRM Integration', 'jetpack' ) } initialOpen={ false }>
								<CRMIntegrationSettings jetpackCRM={ jetpackCRM } setAttributes={ setAttributes } />
							</PanelBody>
						) }
						<PanelBody title={ __( 'Newsletter Integration', 'jetpack' ) } initialOpen={ false }>
							<NewsletterIntegrationSettings />
						</PanelBody>
					</Fragment>
				) }
			</InspectorControls>

			<div className={ formClassnames }>
				<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateInsertUpdatesSelection={ false } />
			</div>
		</>
	);
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( 'core/blocks' );
		const { getBlocks } = select( 'core/block-editor' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getSite, getUser, canUser } = select( 'core' );
		const innerBlocks = getBlocks( props.clientId );

		const authorId = getEditedPostAttribute( 'author' );
		const authorEmail = authorId && getUser( authorId ) && getUser( authorId ).email;
		const postTitle = getEditedPostAttribute( 'title' );
		const canUserInstallPlugins = canUser( 'create', 'plugins' );

		const submitButton = innerBlocks.find( block => block.name === 'jetpack/button' );
		if ( submitButton && ! submitButton.attributes.lock ) {
			const lock = { move: false, remove: true };
			submitButton.attributes.lock = lock;
		}

		return {
			blockType: getBlockType && getBlockType( props.name ),
			canUserInstallPlugins,
			defaultVariation: getDefaultBlockVariation && getDefaultBlockVariation( props.name, 'block' ),
			variations: getBlockVariations && getBlockVariations( props.name, 'block' ),

			innerBlocks,
			hasInnerBlocks: innerBlocks.length > 0,
			siteTitle: get( getSite && getSite(), [ 'title' ] ),
			postTitle: postTitle,
			postAuthorEmail: authorEmail,
		};
	} ),
	withDispatch( dispatch => {
		const { replaceInnerBlocks, selectBlock } = dispatch( 'core/block-editor' );
		return { replaceInnerBlocks, selectBlock };
	} ),
	withInstanceId,
] )( JetpackContactFormEdit );
