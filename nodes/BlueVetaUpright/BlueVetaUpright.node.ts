import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow'
import { NodeConnectionTypes } from 'n8n-workflow'
// Real request logic lives in ../../src/detectCore.js, tested with plain node
// (detectCore.test.mjs) -- this file is thin n8n wiring only, same split as
// apify-actor/src/main.js + handleDetection.js.
// @ts-ignore -- plain JS module, no .d.ts shipped for this internal core
import { detectRotation } from '../../src/detectCore.js'

export class BlueVetaUpright implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BlueVetaUpright',
		name: 'blueVetaUpright',
		icon: 'file:upright.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Detect whether a product photo is sideways or upside-down, and fix it',
		defaults: { name: 'BlueVetaUpright' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'blueVetaUprightApi', required: true }],
		properties: [
			{
				displayName: 'Image Source',
				name: 'imageSource',
				type: 'options',
				options: [
					{ name: 'Image URL', value: 'url' },
					{ name: 'Binary Data', value: 'binary' },
				],
				default: 'url',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				displayOptions: { show: { imageSource: ['url'] } },
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: { show: { imageSource: ['binary'] } },
				description: 'Name of the binary property on the input item holding the image',
			},
			{
				displayName: 'Return Corrected Image',
				name: 'returnImage',
				type: 'boolean',
				default: false,
				description: 'Whether to also get back the photo already rotated upright (costs more — see blueveta.com/upright pricing)',
			},
		],
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData()
		const returnData: INodeExecutionData[] = []
		const credentials = await this.getCredentials('blueVetaUprightApi')
		const apiKey = credentials.apiKey as string

		for (let i = 0; i < items.length; i++) {
			const imageSource = this.getNodeParameter('imageSource', i) as string
			const returnImage = this.getNodeParameter('returnImage', i) as boolean

			let input: { imageUrl?: string; imageBase64?: string; imageMimeType?: string; returnImage: boolean }
			if (imageSource === 'url') {
				input = { imageUrl: this.getNodeParameter('imageUrl', i) as string, returnImage }
			} else {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string
				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName)
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName)
				input = {
					imageBase64: buffer.toString('base64'),
					imageMimeType: binaryData.mimeType,
					returnImage,
				}
			}

			const result = await detectRotation(input, { fetchImpl: fetch, apiKey })

			if (result.status >= 400) {
				throw new Error(`BlueVetaUpright API error (${result.status}): ${JSON.stringify(result.body)}`)
			}

			returnData.push({ json: result.body, pairedItem: { item: i } })
		}

		return [returnData]
	}
}
