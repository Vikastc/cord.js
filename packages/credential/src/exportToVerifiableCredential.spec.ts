/**
 * @group unit/vc-export
 */

import type { IRequestForMark } from '@cordnetwork/types'
import { Mark, MarkedStream, MType, Did } from '@cordnetwork/core'
import toVC from './exportToVerifiableCredential'
import verificationUtils, { MarkStatus } from './verificationUtils'
import holderUtils, { makePresentation } from './presentationUtils'
import type { VerifiableCredential } from './types'
import {
  CORD_VERIFIABLE_CREDENTIAL_TYPE,
  DEFAULT_VERIFIABLE_CREDENTIAL_CONTEXT,
  DEFAULT_VERIFIABLE_CREDENTIAL_TYPE,
  CORD_CREDENTIAL_CONTEXT_URL,
} from './constants'

const mtype = MType.fromMType({
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    name: 'membership',
    properties: {
      birthday: {
        type: 'string',
        format: 'date',
      },
      name: {
        type: 'string',
      },
      premium: {
        type: 'boolean',
      },
    },
    type: 'object',
    $id: 'cord:schema:0xf0fd09f9ed6233b2627d37eb5d6c528345e8945e0b610e70997ed470728b2ebf',
  },
  owner: '4sejigvu6STHdYmmYf2SuN92aNp8TbrsnBBDUj7tMrJ9Z3cG',
  hash: '0xf0fd09f9ed6233b2627d37eb5d6c528345e8945e0b610e70997ed470728b2ebf',
})

const credential = MarkedStream.fromMarkedStream({
  request: {
    stream: {
      contents: {
        birthday: '1991-01-01',
        name: 'Kurt',
        premium: true,
      },
      holder: '4r1WkS3t8rbCb11H8t3tJvGVCynwDXSUBiuGB6sLRHzCLCjs',
      mTypeHash:
        '0xf0fd09f9ed6233b2627d37eb5d6c528345e8945e0b610e70997ed470728b2ebf',
    },
    streamHashes: [
      '0x0586412d7b8adf811c288211c9c704b3331bb3adb61fba6448c89453568180f6',
      '0x3856178f49d3c379e00793125678eeb8db61cfa4ed32cd7a4b67ac8e27714fc1',
      '0x683428497edeba0198f02a45a7015fc2c010fa75994bc1d1372349c25e793a10',
      '0x8804cc546c4597b2ab0541dd3a6532e338b0b5b4d2458eb28b4d909a5d4caf4e',
    ],
    streamNonceMap: {
      '0xe5a099ea4f8be89227af8a5d74b0371e1c13232978c8b8edce1ecec698eb2665':
        'eab8a98c-0ef3-4a33-a5c7-c9821b3bec45',
      '0x14a06c5955ebc9247c9f54b30e0f1714e6ebd54ae05ad7b16fa9a4643dff1dc2':
        'fda7a7d4-770c-4cae-9cd9-6deebdb3ed80',
      '0xb102f462e4cde1b48e7936085cef1e2ab6ae4f7ca46cd3fab06074c00546a33d':
        'ed28443a-ec36-4a54-9caa-6bf014df257d',
      '0xf42b46c4a7a3bad68650069bd81fdf2085c9ea02df1c27a82282e97e3f71ef8e':
        'adc7dc71-ab0a-45f9-a091-9f3ec1bb96c7',
    },
    legitimations: [],
    delegationId: null,
    rootHash:
      '0x24195dd6313c0bb560f3043f839533b54bcd32d602dd848471634b0345ec88ad',
    holderSignature:
      '0x00c374b5314d7192224bd620047f740c029af118eb5645a4662f76a2e3d70a877290f9a96cb9ee9ccc6c6bce24a0cf132a07edb603d0d0632f84210d528d2a7701',
  },
  mark: {
    streamHash:
      '0x24195dd6313c0bb560f3043f839533b54bcd32d602dd848471634b0345ec88ad',
    mTypeHash:
      '0xf0fd09f9ed6233b2627d37eb5d6c528345e8945e0b610e70997ed470728b2ebf',
    delegationId: null,
    issuer: '4sejigvu6STHdYmmYf2SuN92aNp8TbrsnBBDUj7tMrJ9Z3cG',
    revoked: false,
  },
})

it('exports credential to VC', () => {
  expect(toVC.fromMarkedStream(credential)).toMatchObject({
    '@context': [
      DEFAULT_VERIFIABLE_CREDENTIAL_CONTEXT,
      CORD_CREDENTIAL_CONTEXT_URL,
    ],
    type: [DEFAULT_VERIFIABLE_CREDENTIAL_TYPE, CORD_VERIFIABLE_CREDENTIAL_TYPE],
    credentialSubject: {
      '@id': 'did:cord:4r1WkS3t8rbCb11H8t3tJvGVCynwDXSUBiuGB6sLRHzCLCjs',
      birthday: '1991-01-01',
      name: 'Kurt',
      premium: true,
    },
    id: 'cord:cred:0x24195dd6313c0bb560f3043f839533b54bcd32d602dd848471634b0345ec88ad',
    issuanceDate: expect.any(String),
    issuer: 'did:cord:4sejigvu6STHdYmmYf2SuN92aNp8TbrsnBBDUj7tMrJ9Z3cG',
    legitimationIds: [],
    nonTransferable: true,
  })
})

it('exports includes mtype as schema', () => {
  expect(toVC.fromMarkedStream(credential, mtype)).toMatchObject({
    credentialSchema: {
      '@id': mtype.schema.$id,
      name: mtype.schema.name,
      '@type': 'JsonSchemaValidator2018',
      author: mtype.owner ? Did.getIdentifierFromAddress(mtype.owner) : null,
      schema: mtype.schema,
    },
  })
})

it('VC has correct format (full example)', () => {
  expect(toVC.fromMarkedStream(credential, mtype)).toMatchObject({
    '@context': [
      DEFAULT_VERIFIABLE_CREDENTIAL_CONTEXT,
      CORD_CREDENTIAL_CONTEXT_URL,
    ],
    type: [DEFAULT_VERIFIABLE_CREDENTIAL_TYPE, CORD_VERIFIABLE_CREDENTIAL_TYPE],
    credentialSchema: {
      '@id': expect.any(String),
      '@type': 'JsonSchemaValidator2018',
      author: expect.any(String),
      name: 'membership',
      schema: {
        $id: expect.any(String),
        $schema: 'http://json-schema.org/draft-07/schema#',
        properties: {
          birthday: {
            format: 'date',
            type: 'string',
          },
          name: {
            type: 'string',
          },
          premium: {
            type: 'boolean',
          },
        },
        name: 'membership',
        type: 'object',
      },
    },
    credentialSubject: {
      '@context': {
        '@vocab': expect.any(String),
      },
      '@id': expect.any(String),
      birthday: '1991-01-01',
      name: 'Kurt',
      premium: true,
    },
    delegationId: undefined,
    id: expect.any(String),
    issuanceDate: expect.any(String),
    issuer: expect.any(String),
    legitimationIds: [],
    nonTransferable: true,
    proof: [
      {
        signature: expect.any(String),
        type: 'SelfSigned',
        verificationMethod: {
          publicKeyHex: expect.any(String),
          type: 'Ed25519VerificationKey2018',
        },
      },
      {
        issuerAddress: expect.any(String),
        type: 'Mark',
      },
      {
        streamHashes: expect.any(Array),
        nonces: expect.any(Object),
        type: 'CredentialDigest',
      },
    ],
  })
})

describe('proofs', () => {
  let VC: VerifiableCredential
  beforeAll(() => {
    VC = toVC.fromMarkedStream(credential)
  })

  it('it verifies self-signed proof', () => {
    expect(
      verificationUtils.verifySelfSignedProof(VC, VC.proof[0])
    ).toMatchObject({
      verified: true,
    })
  })

  it('it verifies schema', () => {
    const VCWithSchema = toVC.fromMarkedStream(credential, mtype)
    const result = verificationUtils.validateSchema(VCWithSchema)
    expect(result.errors).toEqual([])
    expect(result).toMatchObject({
      verified: true,
    })
  })

  it('it verifies credential with all properties revealed', async () => {
    expect(VC.proof[2].nonces).toMatchObject(credential.request.streamNonceMap)
    expect(Object.entries(VC.proof[2].nonces)).toHaveLength(4)
    const result = await verificationUtils.verifyCredentialDigestProof(
      VC,
      VC.proof[2]
    )
    expect(result.errors).toEqual([])
    expect(result).toMatchObject({
      verified: true,
    })
  })

  it('it verifies credential with selected properties revealed', async () => {
    const reducedRequest: IRequestForMark = JSON.parse(
      JSON.stringify(credential.request)
    )
    delete reducedRequest.stream.contents.name
    delete reducedRequest.stream.contents.birthday
    const reducedCredential = { ...credential, request: reducedRequest }
    const reducedVC = toVC.fromMarkedStream(reducedCredential)

    const result = await verificationUtils.verifyCredentialDigestProof(
      reducedVC,
      reducedVC.proof[2]
    )
    expect(result.errors).toEqual([])
    expect(result).toMatchObject({
      verified: true,
    })
  })

  it('makes presentation', async () => {
    const presentation = await holderUtils.makePresentation(VC, ['name'])
    const { contents, holder } = credential.request.stream
    expect(presentation).toHaveProperty(
      'verifiableCredential.credentialSubject',
      {
        '@context': expect.any(Object),
        '@id': Did.getIdentifierFromAddress(holder),
        name: contents.name,
      }
    )
    const VCfromPresentation =
      presentation.verifiableCredential as VerifiableCredential
    const result = await verificationUtils.verifyCredentialDigestProof(
      VCfromPresentation,
      VCfromPresentation.proof[2]
    )
    expect(result.errors).toEqual([])
    expect(result).toStrictEqual({ verified: true, errors: [] })
    expect(Object.entries(VCfromPresentation.proof[2].nonces)).toHaveLength(2)
  })

  it('verifies mark proof on chain', async () => {
    jest.spyOn(Mark, 'query').mockResolvedValue(Mark.fromMark(credential.mark))

    const result = await verificationUtils.verifyAttestedProof(VC, VC.proof[1])
    expect(result.errors).toEqual([])
    expect(result).toMatchObject({
      verified: true,
      status: MarkStatus.valid,
    })
  })

  describe('negative tests', () => {
    beforeEach(() => {
      VC = toVC.fromMarkedStream(credential, mtype)
    })

    it('errors on proof mismatch', async () => {
      expect(
        verificationUtils.verifySelfSignedProof(VC, VC.proof[1])
      ).toMatchObject({
        verified: false,
      })
      await expect(
        verificationUtils.verifyCredentialDigestProof(VC, VC.proof[0])
      ).resolves.toMatchObject({
        verified: false,
      })
      await expect(
        verificationUtils.verifyAttestedProof(VC, VC.proof[2])
      ).resolves.toMatchObject({
        verified: false,
      })
    })

    it('rejects selecting non-existent properties for presentation', async () => {
      await expect(
        makePresentation(VC, ['name', 'age', 'profession'])
      ).rejects.toThrow()

      const presentation = await makePresentation(VC, ['name'])

      await expect(
        makePresentation(
          presentation.verifiableCredential as VerifiableCredential,
          ['premium']
        )
      ).rejects.toThrow()
    })

    it('it detects tampering with credential digest', () => {
      VC.id = `${VC.id.slice(0, 10)}1${VC.id.slice(11)}`
      expect(
        verificationUtils.verifySelfSignedProof(VC, VC.proof[0])
      ).toMatchObject({
        verified: false,
      })
      return expect(
        verificationUtils.verifyCredentialDigestProof(VC, VC.proof[2])
      ).resolves.toMatchObject({
        verified: false,
      })
    })

    it('it detects tampering with credential fields', async () => {
      jest
        .spyOn(Mark, 'query')
        .mockResolvedValue(Mark.fromMark(credential.mark))

      VC.delegationId = '0x123'
      await expect(
        verificationUtils.verifyCredentialDigestProof(VC, VC.proof[2])
      ).resolves.toMatchObject({
        verified: false,
      })
      await expect(
        verificationUtils.verifyAttestedProof(VC, VC.proof[1])
      ).resolves.toMatchObject({
        verified: false,
        status: MarkStatus.invalid,
      })
    })

    it('it detects tampering on streamed properties', () => {
      VC.credentialSubject.name = 'Kort'
      return expect(
        verificationUtils.verifyCredentialDigestProof(VC, VC.proof[2])
      ).resolves.toMatchObject({
        verified: false,
      })
    })

    it('it detects schema violations', () => {
      VC.credentialSubject.name = 42
      const result = verificationUtils.validateSchema(VC)
      expect(result).toMatchObject({
        verified: false,
      })
    })

    it('fails if mark not on chain', async () => {
      jest.spyOn(Mark, 'query').mockResolvedValue(null)

      const result = await verificationUtils.verifyAttestedProof(
        VC,
        VC.proof[1]
      )
      expect(result).toMatchObject({
        verified: false,
        status: MarkStatus.invalid,
      })
    })

    it('fails if mark on chain not identical', async () => {
      jest.spyOn(Mark, 'query').mockResolvedValue(
        Mark.fromMark({
          ...credential.mark,
          issuer: credential.request.stream.holder,
        })
      )

      const result = await verificationUtils.verifyAttestedProof(
        VC,
        VC.proof[1]
      )
      expect(result).toMatchObject({
        verified: false,
        status: MarkStatus.invalid,
      })
    })

    it('fails if mark revoked', async () => {
      jest.spyOn(Mark, 'query').mockResolvedValue(
        Mark.fromMark({
          ...credential.mark,
          revoked: true,
        })
      )

      const result = await verificationUtils.verifyAttestedProof(
        VC,
        VC.proof[1]
      )
      expect(result).toMatchObject({
        verified: false,
        status: MarkStatus.revoked,
      })
    })
  })
})
