import { ethers } from "ethers";


export function verifyMessage(message: string, signature: string, address: string): boolean {
  const signer = ethers.utils.verifyMessage(message, signature);
  return signer.toLowerCase() === address.toLowerCase();
}


