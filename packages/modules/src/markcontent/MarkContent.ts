/**
 * A MarkContent represents [[Content]] which needs to be validated
 * and transformed.
 *
 * @packageDocumentation
 * @module MarkContent
 */

import type {
  IMarkContent,
  CompressedMarkContent,
  Hash,
  IContent,
  IMark,
} from '@cord.network/api-types'
import { Crypto, SDKErrors } from '@cord.network/utils'
import * as ContentUtils from '../content/Content.utils.js'
import { Mark } from '../mark/Mark.js'
import { Identity } from '../identity/Identity.js'
import * as MarkContentUtils from './MarkContent.utils.js'
// import { UUID } from '@cord.network/utils'
import { STREAM_IDENTIFIER, STREAM_PREFIX } from '@cord.network/api-types'
import { Identifier } from '@cord.network/utils'
// import { stringToU8a } from '@polkadot/util'

function verifyCreatorSignature(content: IMarkContent): boolean {
  // console.log('Hash u8a', stringToU8a(content.contentHash))
  return Crypto.verify(
    // Crypto.hashStr(content.contentHash),
    content.rootHash,
    content.issuerSignature,
    content.content.issuer
  )
}

function getHashRoot(leaves: Uint8Array[]): Uint8Array {
  const result = Crypto.u8aConcat(...leaves)
  return Crypto.hash(result)
}

export type Options = {
  legitimations?: Mark[]
  link?: IMarkContent['link']
  nonceSalt?: string
}
export class MarkContent implements IMarkContent {
  /**
   * [STATIC] Builds an instance of [[MarkContent]], from a simple object with the same properties.
   * Used for deserialization.
   *
   */
  public static fromMarkContent(content: IMarkContent): MarkContent {
    return new MarkContent(content)
  }

  /**
   * [STATIC] Builds a new instance of [[MarkContent]], from a complete set of required parameters.
   *
   * @param content An `IMarkContent` object the request for mark is built for.
   * @param identity The Holder's [[Identity]].
   * @param option Container for different options that can be passed to this method.
   * @param option.proofs Array of [[Mark]] objects.
   * @throws [[ERROR_IDENTITY_MISMATCH]] when streamInput's holder address does not match the supplied identity's address.
   * @returns A new [[MarkContent]] object.
   * @example ```javascript
   * const input = MarkContent.fromStreamAndIdentity(content, alice);
   * ```
   */
  public static fromContentProperties(
    content: IContent,
    issuer: Identity,
    { legitimations, link }: Options = {}
  ): MarkContent {
    if (content.issuer !== issuer.address) {
      throw SDKErrors.ERROR_IDENTITY_MISMATCH()
    }

    const { hashes: contentHashes, nonceMap: contentNonceMap } =
      ContentUtils.hashContents(content)

    const rootHash = MarkContent.calculateRootHash({
      legitimations,
      contentHashes,
    })

    return new MarkContent({
      content,
      contentHashes,
      contentNonceMap,
      legitimations: legitimations || [],
      link,
      issuerSignature: MarkContent.sign(issuer, rootHash),
      rootHash,
      contentId: Identifier.getIdentifier(
        rootHash,
        STREAM_IDENTIFIER,
        STREAM_PREFIX
      ),
    })
  }

  /**
   * [STATIC] Update instance of [[MarkContent]], from a complete set of required parameters.
   *
   * @param content An `IMarkContent` object the request for mark is built for.
   * @param identity The Holder's [[Identity]].
   * @param option Container for different options that can be passed to this method.
   * @param option.proofs Array of [[Mark]] objects.
   * @throws [[ERROR_IDENTITY_MISMATCH]] when streamInput's holder address does not match the supplied identity's address.
   * @returns A new [[MarkContent]] object.
   * @example ```javascript
   * const input = MarkContent.fromStreamAndIdentity(content, alice);
   * ```
   */
  public static updateMarkContentProperties(
    content: IMarkContent,
    issuer: Identity,
    { legitimations }: Options = {}
  ): MarkContent {
    if (content.content.issuer !== issuer.address) {
      throw SDKErrors.ERROR_IDENTITY_MISMATCH()
    }
    let updateLegitimations = legitimations || content.legitimations

    const { hashes: contentHashes, nonceMap: contentNonceMap } =
      ContentUtils.hashContents(content.content)

    const rootHash = MarkContent.calculateRootHash({
      legitimations: updateLegitimations,
      contentHashes,
    })

    return new MarkContent({
      content: content.content,
      contentHashes,
      contentNonceMap,
      legitimations: legitimations || content.legitimations,
      link: content.link,
      issuerSignature: MarkContent.sign(issuer, rootHash),
      rootHash,
      contentId: content.contentId,
    })
  }

  /**
   * [STATIC] Custom Type Guard to determine input being of type IMarkContent..
   *
   * @param input - A potentially only partial [[]].
   *
   * @returns  Boolean whether input is of type IMarkContent.
   */
  public static isIMarkContent(input: unknown): input is IMarkContent {
    try {
      MarkContentUtils.errorCheck(input as IMarkContent)
    } catch (error) {
      return false
    }
    return true
  }

  public content: IContent
  public contentHashes: string[]
  public contentNonceMap: Record<string, string>
  public legitimations: Mark[]
  public link: IMarkContent['link']
  public issuerSignature: string
  public rootHash: Hash
  public contentId: string

  /**
   * Builds a new [[MarkContent]] instance.
   *
   * @param requestForMarkInput - The base object from which to create the input.
   * @example ```javascript
   * // create a new request for mark
   * const reqForAtt = new MarkContent(requestForMarkInput);
   * ```
   */
  public constructor(markContentRequest: IMarkContent) {
    MarkContentUtils.errorCheck(markContentRequest)
    this.contentId = markContentRequest.contentId
    this.content = markContentRequest.content
    this.contentHashes = markContentRequest.contentHashes
    this.contentNonceMap = markContentRequest.contentNonceMap
    if (
      markContentRequest.legitimations &&
      Array.isArray(markContentRequest.legitimations) &&
      markContentRequest.legitimations.length
    ) {
      this.legitimations = markContentRequest.legitimations.map((proof) =>
        Mark.fromMark(proof)
      )
    } else {
      this.legitimations = []
    }
    this.rootHash = markContentRequest.rootHash
    this.link = markContentRequest.link
    this.issuerSignature = markContentRequest.issuerSignature
    this.verifySignature()
    this.verifyData()
  }

  /**
   * Removes [[Content] properties from the [[MarkContent]] object, provides anonymity and security when building the [[createPresentation]] method.
   *
   * @param properties - Properties to remove from the [[Stream]] object.
   * @throws [[ERROR_STREAM_HASHTREE_MISMATCH]] when a property which should be deleted wasn't found.
   * @example ```javascript
   * const rawStream = {
   *   name: 'Alice',
   *   age: 29,
   * };
   * const stream = Stream.fromMTypeAndStreamContents(mtype, rawStream, alice);
   * const reqForAtt = MarkContent.fromStreamAndIdentity({
   *   stream,
   *   identity: alice,
   * });
   * reqForAtt.removeStreamProperties(['name']);
   * // reqForAtt does not contain `name` in its streamHashTree and its stream marks anymore.
   * ```
   */
  public removeContentProperties(properties: string[]): void {
    properties.forEach((key) => {
      delete this.content.contents[key]
    })
    this.contentNonceMap = ContentUtils.hashContents(this.content, {
      nonces: this.contentNonceMap,
    }).nonceMap
  }

  /**
   * Verifies the data of the [[MarkContent]] object; used to check that the data was not tampered with, by checking the data against hashes.
   *
   * @param input - The [[MarkContent]] for which to verify data.
   * @returns Whether the data is valid.
   * @throws [[ERROR_STREAM_NONCE_MAP_MALFORMED]] when any key of the stream marks could not be found in the streamHashTree.
   * @throws [[ERROR_ROOT_HASH_UNVERIFIABLE]] or [[ERROR_SIGNATURE_UNVERIFIABLE]] when either the rootHash or the signature are not verifiable respectively.
   * @example ```javascript
   * const reqForAtt = MarkContent.fromStreamAndIdentity(stream, alice);
   * MarkContent.verifyData(reqForAtt); // returns true if the data is correct
   * ```
   */
  public static verifyData(input: IMarkContent): boolean {
    // check stream hash
    if (!MarkContent.verifyRootHash(input)) {
      throw SDKErrors.ERROR_ROOT_HASH_UNVERIFIABLE()
    }
    // check signature
    if (!MarkContent.verifySignature(input)) {
      throw SDKErrors.ERROR_SIGNATURE_UNVERIFIABLE()
    }

    // verify properties against selective disclosure proof
    const verificationResult = ContentUtils.verifyDisclosedAttributes(
      input.content,
      {
        nonces: input.contentNonceMap,
        hashes: input.contentHashes,
      }
    )
    // TODO: how do we want to deal with multiple errors during stream verification?
    if (!verificationResult.verified)
      throw (
        verificationResult.errors[0] || SDKErrors.ERROR_CONTENT_UNVERIFIABLE()
      )

    // check proofs
    Mark.validateProofs(input.legitimations)

    return true
  }

  public verifyData(): boolean {
    return MarkContent.verifyData(this)
  }

  /**
   * Verifies the signature of the [[MarkContent]] object.
   *
   * @param input - [[MarkContent]] .
   * @returns Whether the signature is correct.
   * @example ```javascript
   * const reqForAtt = MarkContent.fromStreamAndIdentity({
   *   stream,
   *   identity: alice,
   * });
   * MarkContent.verifySignature(reqForAtt); // returns `true` if the signature is correct
   * ```
   */
  public static verifySignature(input: IMarkContent): boolean {
    return verifyCreatorSignature(input)
  }

  public verifySignature(): boolean {
    return MarkContent.verifySignature(this)
  }

  public static verifyRootHash(input: IMarkContent): boolean {
    return input.rootHash === MarkContent.calculateRootHash(input)
  }

  public verifyRootHash(): boolean {
    return MarkContent.verifyRootHash(this)
  }

  private static sign(identity: Identity, rootHash: Hash): string {
    // return identity.signStr(Crypto.hashStr(rootHash))
    return identity.signStr(rootHash)
  }

  private static getHashLeaves(
    contentHashes: Hash[],
    legitimations: IMark[]
  ): Uint8Array[] {
    const result: Uint8Array[] = []
    contentHashes.forEach((item) => {
      result.push(Crypto.coToUInt8(item))
    })
    if (legitimations) {
      legitimations.forEach((legitimation) => {
        result.push(Crypto.coToUInt8(legitimation.content.streamId))
      })
    }
    return result
  }

  /**
   * Compresses an [[MarkContent]] object.
   *
   * @returns An array that contains the same properties of an [[MarkContent]].
   */
  public compress(): CompressedMarkContent {
    return MarkContentUtils.compress(this)
  }

  /**
   * [STATIC] Builds an [[MarkContent]] from the decompressed array.
   *
   * @param reqForAtt The [[CompressedMarkContent]] that should get decompressed.
   * @returns A new [[MarkContent]] object.
   */
  public static decompress(
    requestForStream: CompressedMarkContent
  ): MarkContent {
    const decompressedContentStream =
      MarkContentUtils.decompress(requestForStream)
    return MarkContent.fromMarkContent(decompressedContentStream)
  }

  private static calculateRootHash(mark: Partial<IMarkContent>): Hash {
    const hashes: Uint8Array[] = MarkContent.getHashLeaves(
      mark.contentHashes || [],
      mark.legitimations || []
    )
    const root: Uint8Array = getHashRoot(hashes)
    // return Crypto.u8aToHex(root)
    return Crypto.hashStr(root)
  }
}
