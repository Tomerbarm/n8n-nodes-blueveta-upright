import type { ICredentialType, INodeProperties } from 'n8n-workflow'

// BYOK: the n8n user's OWN BlueVetaUpright API key (bvu_live_... / bvu_test_...),
// same auth header the direct REST API and the MCP server both already use.
export class BlueVetaUprightApi implements ICredentialType {
	name = 'blueVetaUprightApi'
	displayName = 'BlueVetaUpright API'
	documentationUrl = 'https://blueveta.com/upright'
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your BlueVetaUpright API key from blueveta.com/upright (starts with bvu_live_ or bvu_test_)',
		},
	]
}
